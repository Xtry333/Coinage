import { Injectable, Logger } from '@nestjs/common';

import { Category } from '../../entities/Category.entity';
import { getEntityMatchPrompt, getReceiptExtractionPromptPolish } from './prompts.model';

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

@Injectable()
export class OllamaService {
    private readonly logger = new Logger(OllamaService.name);

    private readonly provider: ReceiptAIProvider;
    private readonly baseUrl: string;
    private readonly model: string;
    private readonly timeoutMs: number;
    private readonly resolveTimeoutMs: number;
    private readonly availabilityCheckTimeoutMs = 5000;

    public constructor() {
        this.provider = (process.env['RECEIPT_AI_PROVIDER'] ?? 'lmstudio') as ReceiptAIProvider;

        if (this.provider === 'lmstudio') {
            this.baseUrl = process.env['LM_STUDIO_BASE_URL'] ?? 'http://192.168.50.176:1234';
            this.model = process.env['LM_STUDIO_MODEL'] ?? 'qwen/qwen3.5-9b';
        } else {
            this.baseUrl = process.env['OLLAMA_BASE_URL'] ?? 'http://localhost:11434';
            this.model = process.env['OLLAMA_MODEL'] ?? 'llava';
        }

        this.timeoutMs = parseInt(process.env['OLLAMA_TIMEOUT_MS'] ?? '600000');
        this.resolveTimeoutMs = parseInt(process.env['OLLAMA_RESOLVE_TIMEOUT_MS'] ?? '120000');
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

    public async extractReceiptData(imagePath: string): Promise<{ data: OllamaExtractedData; rawResponse: string }> {
        this.logger.debug(`Extracting data from: ${imagePath} using ${this.provider} model: ${this.model}`);

        const { readFileSync } = await import('fs');
        const { join } = await import('path');
        const imageBytes = readFileSync(join(process.cwd(), imagePath));
        const base64Image = imageBytes.toString('base64');

        const controller = new AbortController();

        // For LM Studio (streaming): inactivity timer is managed inside readSSEStream.
        // For Ollama (non-streaming): use a hard wall-clock abort here.
        const timer = this.provider !== 'lmstudio' ? setTimeout(() => controller.abort(), this.timeoutMs) : undefined;

        try {
            const today = new Date().toISOString().split('T')[0];
            const extractionPrompt = getReceiptExtractionPromptPolish(today);

            const rawResponse =
                this.provider === 'lmstudio'
                    ? await this.callLMStudioVision(base64Image, extractionPrompt, controller)
                    : await this.callOllamaGenerate(base64Image, extractionPrompt, controller);

            return { data: this.parseResponse(rawResponse), rawResponse };
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
        const categoryNames = categories?.map((c) => c.name) ?? [];
        const prompt = getEntityMatchPrompt(query, candidates, categoryNames);

        const controller = new AbortController();

        // For LM Studio (streaming): inactivity timer is managed inside readSSEStream.
        // For Ollama (non-streaming): use a hard wall-clock abort here.
        const timer = this.provider !== 'lmstudio' ? setTimeout(() => controller.abort(), this.resolveTimeoutMs) : undefined;

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
                stream: true,
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
                        ],
                    },
                ],
            }),
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new Error(`LM Studio responded with ${response.status}: ${await response.text()}`);
        }

        return this.readSSEStream(response, controller, this.timeoutMs);
    }

    private async callLMStudioText(prompt: string, controller: AbortController): Promise<string | null> {
        const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                stream: true,
                messages: [{ role: 'user', content: prompt }],
            }),
            signal: controller.signal,
        });

        if (!response.ok) return null;

        return this.readSSEStream(response, controller, this.resolveTimeoutMs);
    }

    /**
     * Reads an OpenAI-compatible SSE stream and assembles the full content string.
     * Uses an inactivity timer that resets on every received chunk, so the abort
     * only fires if the model goes completely silent — not after a fixed wall-clock limit.
     */
    private async readSSEStream(response: Response, controller: AbortController, idleTimeoutMs: number): Promise<string> {
        if (!response.body) throw new Error('LM Studio returned no response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let content = '';
        let buffer = '';

        let idleTimer = setTimeout(() => controller.abort(), idleTimeoutMs);
        const resetIdle = (): void => {
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => controller.abort(), idleTimeoutMs);
        };

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                resetIdle();
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const data = line.slice(6).trim();
                    if (data === '[DONE]') return content;

                    try {
                        const chunk = JSON.parse(data) as { choices: Array<{ delta: { content?: string } }> };
                        content += chunk.choices[0]?.delta?.content ?? '';
                    } catch {
                        // malformed chunk — skip
                    }
                }
            }
        } finally {
            clearTimeout(idleTimer);
            reader.releaseLock();
        }

        return content;
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
