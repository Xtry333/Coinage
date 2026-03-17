import { Injectable, Logger } from '@nestjs/common';

import { Category } from '../../entities/Category.entity';

export interface OllamaExtractedData {
    date?: string | null;
    amount?: number | null;
    contractor?: string | null;
    description?: string | null;
    items?: Array<{ name: string; price: number; quantity?: number }>;
    rawText?: string | null;
    confidence?: number;
}

export type ReceiptAIProvider = 'ollama' | 'lmstudio';

const RECEIPT_EXTRACTION_PROMPT = `You are a receipt parsing assistant. Analyze the provided receipt image and extract information as JSON:
{
  "date": "YYYY-MM-DD or null",
  "amount": <total amount as number or null>,
  "contractor": "<store/vendor name or null>",
  "description": "<brief description or null>",
  "items": [{"name": "<item>", "price": <price>, "quantity": <qty>}],
  "rawText": "<all text from receipt>",
  "confidence": <0.0-1.0>
}
Return ONLY valid JSON. Use null for unknown fields.`;

@Injectable()
export class OllamaService {
    private readonly logger = new Logger(OllamaService.name);

    private readonly provider: ReceiptAIProvider;
    private readonly baseUrl: string;
    private readonly model: string;
    private readonly timeoutMs: number;
    private readonly availabilityCheckTimeoutMs = 5000;

    public constructor() {
        this.provider = (process.env['RECEIPT_AI_PROVIDER'] ?? 'ollama') as ReceiptAIProvider;

        if (this.provider === 'lmstudio') {
            this.baseUrl = process.env['LM_STUDIO_BASE_URL'] ?? 'http://localhost:1234';
            this.model = process.env['LM_STUDIO_MODEL'] ?? '';
        } else {
            this.baseUrl = process.env['OLLAMA_BASE_URL'] ?? 'http://localhost:11434';
            this.model = process.env['OLLAMA_MODEL'] ?? 'llava';
        }

        this.timeoutMs = parseInt(process.env['OLLAMA_TIMEOUT_MS'] ?? '120000');
    }

    public async isAvailable(): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), this.availabilityCheckTimeoutMs);
            const checkUrl = this.provider === 'lmstudio' ? `${this.baseUrl}/v1/models` : `${this.baseUrl}/api/tags`;
            const res = await fetch(checkUrl, { signal: controller.signal });
            clearTimeout(timer);
            return res.ok;
        } catch {
            return false;
        }
    }

    public async extractReceiptData(imagePath: string): Promise<OllamaExtractedData> {
        this.logger.debug(`Extracting data from: ${imagePath} using ${this.provider} model: ${this.model}`);

        const { readFileSync } = await import('fs');
        const imageBytes = readFileSync(imagePath);
        const base64Image = imageBytes.toString('base64');

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const raw =
                this.provider === 'lmstudio'
                    ? await this.callLMStudioVision(base64Image, RECEIPT_EXTRACTION_PROMPT, controller)
                    : await this.callOllamaGenerate(base64Image, RECEIPT_EXTRACTION_PROMPT, controller);

            return this.parseResponse(raw);
        } finally {
            clearTimeout(timer);
        }
    }

    /**
     * Text-only call to resolve an extracted string (item name, contractor) against a list of
     * fuzzy-match candidates. No image is sent — uses the same model in text mode.
     * Returns null on network/parse failure so the caller can treat it as "no match".
     */
    public async resolveEntityMatch(
        query: string,
        candidates: Array<{ id: number; name: string; score: number }>,
        categories?: Category[],
    ): Promise<{ matchedId: number | null; confidence: number } | null> {
        const categoryHint =
            categories && categories.length > 0
                ? `\nAvailable categories for context: ${categories.map((c) => c.name).join(', ')}.`
                : '';

        const candidateList = candidates.map((c) => `  id ${c.id}: "${c.name}" (fuzzy score: ${c.score.toFixed(2)})`).join('\n');

        const prompt = `You are a data-matching assistant for a personal finance app.

Extracted text from a receipt: "${query}"${categoryHint}

Existing database entries that may match (by fuzzy similarity):
${candidateList}

Task: Decide which entry best matches the extracted text, considering:
- Abbreviations and store-specific naming ("Mleko UHT" ≈ "Mleko UHT 3.2% 1L")
- Spelling variants or OCR errors
- Different languages (Mostly Polish receipts)

Return ONLY valid JSON with no explanation:
{"matchedId": <number or null>, "confidence": <0.0–1.0>}

Use matchedId: null if no entry is a good match (confidence would be < 0.65).`;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 20_000);

        try {
            const raw =
                this.provider === 'lmstudio'
                    ? await this.callLMStudioText(prompt, controller)
                    : await this.callOllamaText(prompt, controller);

            if (raw === null) return null;
            const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleaned) as { matchedId: number | null; confidence: number };
        } catch {
            return null;
        } finally {
            clearTimeout(timer);
        }
    }

    // ── Ollama native API ────────────────────────────────────────────────────

    private async callOllamaGenerate(base64Image: string, prompt: string, controller: AbortController): Promise<string> {
        const response = await fetch(`${this.baseUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: this.model, prompt, images: [base64Image], stream: false, format: 'json' }),
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new Error(`Ollama responded with ${response.status}: ${await response.text()}`);
        }

        const result = (await response.json()) as { response: string };
        return result.response;
    }

    private async callOllamaText(prompt: string, controller: AbortController): Promise<string | null> {
        const response = await fetch(`${this.baseUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: this.model, prompt, stream: false, format: 'json' }),
            signal: controller.signal,
        });

        if (!response.ok) return null;

        const result = (await response.json()) as { response: string };
        return result.response;
    }

    // ── LM Studio OpenAI-compatible API ─────────────────────────────────────

    private async callLMStudioVision(base64Image: string, prompt: string, controller: AbortController): Promise<string> {
        const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
                        ],
                    },
                ],
                response_format: { type: 'json_object' },
            }),
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new Error(`LM Studio responded with ${response.status}: ${await response.text()}`);
        }

        const result = (await response.json()) as { choices: Array<{ message: { content: string } }> };
        return result.choices[0].message.content;
    }

    private async callLMStudioText(prompt: string, controller: AbortController): Promise<string | null> {
        const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
            }),
            signal: controller.signal,
        });

        if (!response.ok) return null;

        const result = (await response.json()) as { choices: Array<{ message: { content: string } }> };
        return result.choices[0].message.content;
    }

    // ── Shared ───────────────────────────────────────────────────────────────

    private parseResponse(raw: string): OllamaExtractedData {
        try {
            const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleaned) as OllamaExtractedData;
        } catch {
            this.logger.warn('Failed to parse AI JSON response, returning raw text');
            return { rawText: raw, confidence: 0 };
        }
    }
}
