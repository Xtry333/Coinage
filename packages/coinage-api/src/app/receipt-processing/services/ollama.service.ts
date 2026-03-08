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

    private readonly baseUrl: string;
    private readonly model: string;
    private readonly timeoutMs: number;
    private readonly availabilityCheckTimeoutMs = 5000;

    public constructor() {
        this.baseUrl = process.env['OLLAMA_BASE_URL'] ?? 'http://localhost:11434';
        this.model = process.env['OLLAMA_MODEL'] ?? 'llava';
        this.timeoutMs = parseInt(process.env['OLLAMA_TIMEOUT_MS'] ?? '120000');
    }

    public async isAvailable(): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), this.availabilityCheckTimeoutMs);
            const res = await fetch(`${this.baseUrl}/api/tags`, { signal: controller.signal });
            clearTimeout(timer);
            return res.ok;
        } catch {
            return false;
        }
    }

    public async extractReceiptData(imagePath: string): Promise<OllamaExtractedData> {
        this.logger.debug(`Extracting data from: ${imagePath} using model: ${this.model}`);

        const { readFileSync } = await import('fs');
        const imageBytes = readFileSync(imagePath);
        const base64Image = imageBytes.toString('base64');

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.model,
                    prompt: RECEIPT_EXTRACTION_PROMPT,
                    images: [base64Image],
                    stream: false,
                    format: 'json',
                }),
                signal: controller.signal,
            });

            clearTimeout(timer);

            if (!response.ok) {
                throw new Error(`Ollama responded with ${response.status}: ${await response.text()}`);
            }

            const result = (await response.json()) as { response: string };
            return this.parseResponse(result.response);
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
- Different languages (Polish receipts are common)

Return ONLY valid JSON with no explanation:
{"matchedId": <number or null>, "confidence": <0.0–1.0>}

Use matchedId: null if no entry is a good match (confidence would be < 0.65).`;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 20_000);

        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: this.model, prompt, stream: false, format: 'json' }),
                signal: controller.signal,
            });
            clearTimeout(timer);

            if (!response.ok) return null;

            const result = (await response.json()) as { response: string };
            const cleaned = result.response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleaned) as { matchedId: number | null; confidence: number };
        } catch {
            return null;
        } finally {
            clearTimeout(timer);
        }
    }

    private parseResponse(raw: string): OllamaExtractedData {
        try {
            const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleaned) as OllamaExtractedData;
        } catch {
            this.logger.warn('Failed to parse Ollama JSON response, returning raw text');
            return { rawText: raw, confidence: 0 };
        }
    }
}
