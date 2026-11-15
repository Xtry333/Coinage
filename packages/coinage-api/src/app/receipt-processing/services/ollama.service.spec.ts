import { makeCategory } from '@coinage-app/test/mock-generators/receipt-normalization.mock';

import { TransferTypeEnum } from '../../entities/Category.entity';
import { OllamaService } from './ollama.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const OLLAMA_BASE_URL = 'http://localhost:11434';
const LM_STUDIO_BASE_URL = 'http://localhost:1234';

function makeCandidate(id: number, name: string, score = 0.8) {
    return { id, name, score };
}

/** Simulate a successful Ollama native API response */
function mockOllamaFetchOk(body: object) {
    return jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ response: JSON.stringify(body) }),
    } as unknown as Response);
}

/** Simulate LM Studio's streamed OpenAI-compatible response, including split SSE lines. */
function mockLMStudioFetchOk(body: object) {
    const content = JSON.stringify(body);
    const midpoint = Math.floor(content.length / 2);
    const events = [content.slice(0, midpoint), content.slice(midpoint)]
        .map((part) => `data: ${JSON.stringify({ choices: [{ delta: { content: part } }] })}\n\n`)
        .join('');
    const bytes = new TextEncoder().encode(`${events}data: [DONE]\n\n`);
    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            controller.enqueue(bytes.subarray(0, 19));
            controller.enqueue(bytes.subarray(19));
            controller.close();
        },
    });
    return jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        body: stream,
    } as unknown as Response);
}

function mockFetchError() {
    return jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));
}

function mockFetchNotOk(status = 500) {
    return jest.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: false, status } as unknown as Response);
}

// ─── OllamaService ────────────────────────────────────────────────────────────

describe('OllamaService', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
        for (const key of [
            'RECEIPT_AI_PROVIDER',
            'OLLAMA_BASE_URL',
            'OLLAMA_MODEL',
            'OLLAMA_TIMEOUT_MS',
            'OLLAMA_RESOLVE_TIMEOUT_MS',
            'LM_STUDIO_BASE_URL',
            'LM_STUDIO_MODEL',
        ]) {
            delete process.env[key];
        }
        // No test should fall through to the developer's real AI server.
        jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Unexpected fetch call'));
    });

    afterEach(() => {
        jest.restoreAllMocks();
        process.env = originalEnv;
    });

    // ── Ollama provider ────────────────────────────────────────────────────────

    describe('Ollama provider', () => {
        let service: OllamaService;

        beforeEach(() => {
            process.env['RECEIPT_AI_PROVIDER'] = 'ollama';
            process.env['OLLAMA_BASE_URL'] = OLLAMA_BASE_URL;
            process.env['OLLAMA_MODEL'] = 'llava';
            service = new OllamaService();
        });

        describe('resolveEntityMatch()', () => {
            it('returns parsed matchedId and confidence on success', async () => {
                mockOllamaFetchOk({ matchedId: 42, confidence: 0.9 });

                const result = await service.resolveEntityMatch('Biedronka', [makeCandidate(42, 'Biedronka')]);

                expect(result).toEqual({ matchedId: 42, confidence: 0.9 });
            });

            it('returns null on network error', async () => {
                mockFetchError();

                const result = await service.resolveEntityMatch('Biedronka', [makeCandidate(1, 'Lidl')]);

                expect(result).toBeNull();
            });

            it('returns null when Ollama responds with non-OK status', async () => {
                mockFetchNotOk(503);

                const result = await service.resolveEntityMatch('Biedronka', [makeCandidate(1, 'Lidl')]);

                expect(result).toBeNull();
            });

            it('returns null when response body is not valid JSON', async () => {
                jest.spyOn(global, 'fetch').mockResolvedValueOnce({
                    ok: true,
                    json: jest.fn().mockResolvedValue({ response: 'not json at all' }),
                } as unknown as Response);

                const result = await service.resolveEntityMatch('Biedronka', [makeCandidate(1, 'Lidl')]);

                expect(result).toBeNull();
            });

            it('strips markdown code fences before parsing', async () => {
                jest.spyOn(global, 'fetch').mockResolvedValueOnce({
                    ok: true,
                    json: jest.fn().mockResolvedValue({ response: '```json\n{"matchedId": 7, "confidence": 0.8}\n```' }),
                } as unknown as Response);

                const result = await service.resolveEntityMatch('test', [makeCandidate(7, 'test')]);

                expect(result).toEqual({ matchedId: 7, confidence: 0.8 });
            });

            it('sends request to the correct Ollama endpoint', async () => {
                const fetchSpy = mockOllamaFetchOk({ matchedId: null, confidence: 0 });

                await service.resolveEntityMatch('query', [makeCandidate(1, 'item')]);

                expect(fetchSpy).toHaveBeenCalledWith(`${OLLAMA_BASE_URL}/api/generate`, expect.objectContaining({ method: 'POST' }));
            });

            it('includes each candidate id and name in the prompt', async () => {
                const fetchSpy = mockOllamaFetchOk({ matchedId: null, confidence: 0 });

                await service.resolveEntityMatch('query', [makeCandidate(10, 'Biedronka'), makeCandidate(11, 'Lidl')]);

                const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
                expect(body.prompt).toContain('10 | Biedronka');
                expect(body.prompt).toContain('11 | Lidl');
            });

            it('includes category names in the prompt when provided', async () => {
                const fetchSpy = mockOllamaFetchOk({ matchedId: null, confidence: 0 });
                const categories = [makeCategory(1, 'Groceries', TransferTypeEnum.OUTCOME), makeCategory(2, 'Dairy', TransferTypeEnum.OUTCOME)];

                await service.resolveEntityMatch('Mleko', [makeCandidate(1, 'Mleko UHT')], categories);

                const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
                expect(body.prompt).toContain('Groceries');
                expect(body.prompt).toContain('Dairy');
            });

            it('does not include category hint when no categories are provided', async () => {
                const fetchSpy = mockOllamaFetchOk({ matchedId: null, confidence: 0 });

                await service.resolveEntityMatch('query', [makeCandidate(1, 'item')]);

                const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
                expect(body.prompt).not.toContain('Available categories');
            });

            it('requests json format and disables streaming', async () => {
                const fetchSpy = mockOllamaFetchOk({ matchedId: null, confidence: 0 });

                await service.resolveEntityMatch('query', [makeCandidate(1, 'item')]);

                const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
                expect(body.format).toBe('json');
                expect(body.stream).toBe(false);
            });
        });

        describe('isAvailable()', () => {
            it('checks the Ollama /api/tags endpoint', async () => {
                const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: true } as Response);

                await service.isAvailable();

                expect(fetchSpy).toHaveBeenCalledWith(`${OLLAMA_BASE_URL}/api/tags`, expect.anything());
            });

            it('returns false when the endpoint is unreachable', async () => {
                mockFetchError();
                expect(await service.isAvailable()).toBe(false);
            });
        });
    });

    // ── LM Studio provider ─────────────────────────────────────────────────────

    describe('LM Studio provider', () => {
        let service: OllamaService;

        beforeEach(() => {
            process.env['RECEIPT_AI_PROVIDER'] = 'lmstudio';
            process.env['LM_STUDIO_BASE_URL'] = LM_STUDIO_BASE_URL;
            process.env['LM_STUDIO_MODEL'] = 'lmstudio-community/llava-1.6';
            service = new OllamaService();
        });

        describe('resolveEntityMatch()', () => {
            it('returns parsed matchedId and confidence on success', async () => {
                mockLMStudioFetchOk({ matchedId: 5, confidence: 0.95 });

                const result = await service.resolveEntityMatch('Lidl', [makeCandidate(5, 'Lidl')]);

                expect(result).toEqual({ matchedId: 5, confidence: 0.95 });
            });

            it('sends request to LM Studio /v1/chat/completions', async () => {
                const fetchSpy = mockLMStudioFetchOk({ matchedId: null, confidence: 0 });

                await service.resolveEntityMatch('query', [makeCandidate(1, 'item')]);

                expect(fetchSpy).toHaveBeenCalledWith(`${LM_STUDIO_BASE_URL}/v1/chat/completions`, expect.objectContaining({ method: 'POST' }));
            });

            it('uses messages array format instead of prompt field', async () => {
                const fetchSpy = mockLMStudioFetchOk({ matchedId: null, confidence: 0 });

                await service.resolveEntityMatch('query', [makeCandidate(1, 'item')]);

                const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
                expect(body.messages).toBeDefined();
                expect(body.messages[0].role).toBe('user');
                expect(body.prompt).toBeUndefined();
            });

            it('requests streaming output', async () => {
                const fetchSpy = mockLMStudioFetchOk({ matchedId: null, confidence: 0 });

                await service.resolveEntityMatch('query', [makeCandidate(1, 'item')]);

                const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
                expect(body.stream).toBe(true);
            });

            it('includes candidate ids and names in the message content', async () => {
                const fetchSpy = mockLMStudioFetchOk({ matchedId: null, confidence: 0 });

                await service.resolveEntityMatch('Biedronka', [makeCandidate(10, 'Biedronka'), makeCandidate(11, 'Lidl')]);

                const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
                const content = body.messages[0].content as string;
                expect(content).toContain('10 | Biedronka');
                expect(content).toContain('11 | Lidl');
            });

            it('returns null on network error', async () => {
                mockFetchError();
                expect(await service.resolveEntityMatch('query', [makeCandidate(1, 'item')])).toBeNull();
            });

            it('returns null on non-OK status', async () => {
                mockFetchNotOk(503);
                expect(await service.resolveEntityMatch('query', [makeCandidate(1, 'item')])).toBeNull();
            });
        });

        describe('isAvailable()', () => {
            it('defaults to LM Studio when no provider is configured', async () => {
                delete process.env['RECEIPT_AI_PROVIDER'];
                const defaultService = new OllamaService();
                const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: true } as Response);

                expect(await defaultService.isAvailable()).toBe(true);
                expect(fetchSpy).toHaveBeenCalledWith(`${LM_STUDIO_BASE_URL}/v1/models`, expect.anything());
            });

            it('checks the LM Studio /v1/models endpoint', async () => {
                const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: true } as Response);

                await service.isAvailable();

                expect(fetchSpy).toHaveBeenCalledWith(`${LM_STUDIO_BASE_URL}/v1/models`, expect.anything());
            });

            it('returns false when LM Studio is unreachable', async () => {
                mockFetchError();
                expect(await service.isAvailable()).toBe(false);
            });
        });
    });

    describe('availability timeout cleanup', () => {
        it.each(['success', 'http-error', 'network-error'])('clears its timer after %s', async (outcome) => {
            jest.useFakeTimers();
            try {
                if (outcome === 'network-error') {
                    mockFetchError();
                } else {
                    jest.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: outcome === 'success' } as Response);
                }

                expect(await new OllamaService().isAvailable()).toBe(outcome === 'success');
                expect(jest.getTimerCount()).toBe(0);
            } finally {
                jest.useRealTimers();
            }
        });
    });
});
