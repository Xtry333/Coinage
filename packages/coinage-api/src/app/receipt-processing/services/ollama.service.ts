import { Injectable, Logger } from '@nestjs/common';

import { Category } from '../../entities/Category.entity';
import { BatchItemEntry, BatchMatchResult, getBatchEntityMatchPrompt, getEntityMatchPrompt, getReceiptExtractionPromptPolish } from './prompts.model';

export interface OllamaExtractedData {
    date?: string | null;
    amount?: number | null;
    contractor?: string | null;
    description?: string | null;
    items?: Array<{ name: string; price: number; quantity?: number }>;
    confidence?: number;
}

/**
 * Unified receipt AI service using the OpenAI-compatible `/v1/chat/completions`
 * endpoint. Works with any backend that implements the OpenAI API spec:
 * LM Studio, Ollama (≥0.1.14), vLLM, LocalAI, etc.
 *
 * Configuration (env vars):
 *   RECEIPT_AI_BASE_URL    – Server URL (default: http://192.168.50.176:1234)
 *   RECEIPT_AI_MODEL       – Model identifier (default: qwen/qwen3.5-9b)
 *   RECEIPT_AI_TIMEOUT_MS  – Idle timeout for vision extraction (default: 600000)
 *   RECEIPT_AI_RESOLVE_TIMEOUT_MS – Idle timeout for text matching (default: 120000)
 *   RECEIPT_AI_STREAMING   – "true" for SSE streaming, "false" for blocking (default: true)
 *
 * Legacy env vars (LM_STUDIO_*, OLLAMA_*) are still read as fallbacks.
 */
@Injectable()
export class OllamaService {
    private readonly logger = new Logger(OllamaService.name);

    private readonly baseUrl: string;
    private readonly model: string;
    private readonly timeoutMs: number;
    private readonly resolveTimeoutMs: number;
    private readonly availabilityCheckTimeoutMs = 5000;
    private readonly streaming: boolean;

    public constructor() {
        this.baseUrl =
            process.env['RECEIPT_AI_BASE_URL'] ??
            process.env['LM_STUDIO_BASE_URL'] ??
            process.env['OLLAMA_BASE_URL'] ??
            'http://192.168.50.176:1234';

        this.model =
            process.env['RECEIPT_AI_MODEL'] ??
            process.env['LM_STUDIO_MODEL'] ??
            process.env['OLLAMA_MODEL'] ??
            'qwen/qwen3.5-9b';

        this.timeoutMs = parseInt(
            process.env['RECEIPT_AI_TIMEOUT_MS'] ?? process.env['OLLAMA_TIMEOUT_MS'] ?? '600000',
        );
        this.resolveTimeoutMs = parseInt(
            process.env['RECEIPT_AI_RESOLVE_TIMEOUT_MS'] ?? process.env['OLLAMA_RESOLVE_TIMEOUT_MS'] ?? '120000',
        );
        this.streaming = (process.env['RECEIPT_AI_STREAMING'] ?? 'true') === 'true';
    }

    // ── Public API ────────────────────────────────────────────────────────────

    public async isAvailable(): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), this.availabilityCheckTimeoutMs);
            const res = await fetch(`${this.baseUrl}/v1/models`, { signal: controller.signal });
            clearTimeout(timer);
            return res.ok;
        } catch {
            return false;
        }
    }

    public async extractReceiptData(imagePath: string): Promise<{ data: OllamaExtractedData; rawResponse: string }> {
        this.logger.debug(`Extracting data from: ${imagePath} using model: ${this.model}`);

        const { readFileSync } = await import('fs');
        const { join } = await import('path');
        const imageBytes = readFileSync(join(process.cwd(), imagePath));
        const base64Image = imageBytes.toString('base64');

        const today = new Date().toISOString().split('T')[0];
        const prompt = getReceiptExtractionPromptPolish(today);

        const rawResponse = await this.callVision(base64Image, prompt, this.timeoutMs);
        return { data: this.parseResponse(rawResponse), rawResponse };
    }

    /**
     * Text-only call to resolve an extracted string (item name, contractor) against a list of
     * fuzzy-match candidates. Returns null on network/parse failure so the caller can treat it as "no match".
     */
    public async resolveEntityMatch(
        query: string,
        candidates: Array<{ id: number; name: string; score: number }>,
        categories?: Category[],
    ): Promise<{ matchedId: number | null; confidence: number } | null> {
        const categoryNames = categories?.map((c) => c.name) ?? [];
        const prompt = getEntityMatchPrompt(query, candidates, categoryNames);

        try {
            const raw = await this.callText(prompt, this.resolveTimeoutMs);
            if (raw === null) return null;
            return JSON.parse(this.cleanJsonResponse(raw)) as { matchedId: number | null; confidence: number };
        } catch {
            return null;
        }
    }

    /**
     * Batch-resolve multiple receipt items against their fuzzy candidates in a single AI call.
     * Includes contractor context and purchase history for better matching.
     *
     * Returns per-item results with individual confidence scores, or null on failure.
     * The caller should validate that each matchedId is actually in the candidates for that item.
     */
    public async resolveItemMatchBatch(
        items: BatchItemEntry[],
        contractorName: string | null,
        categoryNames: string[],
        contractorHistoryItemNames: string[],
    ): Promise<BatchMatchResult[] | null> {
        if (items.length === 0) return [];

        const prompt = getBatchEntityMatchPrompt(items, contractorName, categoryNames, contractorHistoryItemNames);
        this.logger.debug(`Batch matching ${items.length} items (prompt length: ${prompt.length} chars)`);

        try {
            const raw = await this.callText(prompt, this.resolveTimeoutMs);
            if (raw === null) {
                this.logger.warn('Batch match call returned null response');
                return null;
            }

            const parsed = JSON.parse(this.cleanJsonResponse(raw)) as { items: BatchMatchResult[] };

            if (!Array.isArray(parsed.items)) {
                this.logger.warn('Batch match response missing items array');
                return null;
            }

            return parsed.items;
        } catch (err) {
            this.logger.warn(`Batch match failed: ${err instanceof Error ? err.message : String(err)}`);
            return null;
        }
    }

    // ── OpenAI-compatible /v1/chat/completions ───────────────────────────────

    /**
     * Vision call: sends an image + text prompt via the OpenAI chat completions API.
     * Throws on non-OK status.
     */
    private async callVision(base64Image: string, prompt: string, timeoutMs: number): Promise<string> {
        const messages = [
            {
                role: 'user',
                content: [
                    { type: 'text', text: prompt },
                    { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
                ],
            },
        ];

        return this.chatCompletion(messages, timeoutMs, true);
    }

    /**
     * Text-only call via the OpenAI chat completions API.
     * Returns null on non-OK status (instead of throwing).
     */
    private async callText(prompt: string, timeoutMs: number): Promise<string | null> {
        const messages = [{ role: 'user', content: prompt }];

        try {
            return await this.chatCompletion(messages, timeoutMs, false);
        } catch {
            return null;
        }
    }

    /**
     * Core method: POST /v1/chat/completions.
     * Supports both streaming (SSE with idle timeout) and non-streaming modes.
     */
    private async chatCompletion(
        messages: Array<{ role: string; content: unknown }>,
        timeoutMs: number,
        throwOnError: boolean,
    ): Promise<string> {
        const controller = new AbortController();

        const body: Record<string, unknown> = {
            model: this.model,
            messages,
            stream: this.streaming,
        };

        if (!this.streaming) {
            body['response_format'] = { type: 'json_object' };
        }

        // For non-streaming: wall-clock timeout. For streaming: idle timer is inside readSSEStream.
        const timer = !this.streaming ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

        try {
            const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: controller.signal,
            });

            if (!response.ok) {
                if (throwOnError) {
                    throw new Error(`AI server responded with ${response.status}: ${await response.text()}`);
                }
                return '';
            }

            if (this.streaming) {
                return await this.readSSEStream(response, controller, timeoutMs);
            }

            const result = (await response.json()) as {
                choices: Array<{ message: { content: string } }>;
            };
            return result.choices[0]?.message?.content ?? '';
        } finally {
            clearTimeout(timer);
        }
    }

    /**
     * Reads an OpenAI-compatible SSE stream and assembles the full content string.
     * Uses an inactivity timer that resets on every received chunk, so the abort
     * only fires if the model goes completely silent — not after a fixed wall-clock limit.
     */
    private async readSSEStream(response: Response, controller: AbortController, idleTimeoutMs: number): Promise<string> {
        if (!response.body) throw new Error('AI server returned no response body');

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

    // ── Shared helpers ───────────────────────────────────────────────────────

    private cleanJsonResponse(raw: string): string {
        return raw
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
    }

    private parseResponse(raw: string): OllamaExtractedData {
        try {
            return JSON.parse(this.cleanJsonResponse(raw)) as OllamaExtractedData;
        } catch {
            this.logger.warn('Failed to parse AI JSON response, returning raw text');
            return { confidence: 0 };
        }
    }
}
