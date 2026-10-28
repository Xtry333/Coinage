import { makeCategory } from '@coinage-app/test/mock-generators/receipt-normalization.mock';
import { TransferTypeEnum } from '../../entities/Category.entity';
import { OllamaService } from './ollama.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:1234';

function makeCandidate(id: number, name: string, score = 0.8) {
    return { id, name, score };
}

/** Simulate a successful non-streaming OpenAI chat completions response */
function mockChatCompletionOk(body: object) {
    return jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ choices: [{ message: { content: JSON.stringify(body) } }] }),
    } as unknown as Response);
}

function mockFetchError() {
    return jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));
}

function mockFetchNotOk(status = 500) {
    return jest.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: false, status } as unknown as Response);
}

// ─── OllamaService (unified OpenAI-compatible) ──────────────────────────────

describe('OllamaService', () => {
    let service: OllamaService;

    beforeEach(() => {
        process.env['RECEIPT_AI_BASE_URL'] = BASE_URL;
        process.env['RECEIPT_AI_MODEL'] = 'test-model';
        process.env['RECEIPT_AI_STREAMING'] = 'false';
        service = new OllamaService();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        delete process.env['RECEIPT_AI_BASE_URL'];
        delete process.env['RECEIPT_AI_MODEL'];
        delete process.env['RECEIPT_AI_STREAMING'];
        delete process.env['RECEIPT_AI_TIMEOUT_MS'];
        delete process.env['RECEIPT_AI_RESOLVE_TIMEOUT_MS'];
        // Legacy env vars
        delete process.env['RECEIPT_AI_PROVIDER'];
        delete process.env['OLLAMA_BASE_URL'];
        delete process.env['OLLAMA_MODEL'];
        delete process.env['LM_STUDIO_BASE_URL'];
        delete process.env['LM_STUDIO_MODEL'];
    });

    // ── Configuration ────────────────────────────────────────────────────────

    describe('configuration', () => {
        it('reads RECEIPT_AI_BASE_URL and RECEIPT_AI_MODEL', () => {
            process.env['RECEIPT_AI_BASE_URL'] = 'http://custom:9999';
            process.env['RECEIPT_AI_MODEL'] = 'custom-model';
            const svc = new OllamaService();

            const fetchSpy = mockChatCompletionOk({ matchedId: null, confidence: 0 });
            svc.resolveEntityMatch('query', [makeCandidate(1, 'item')]);

            // Verify it calls the custom URL
            expect(fetchSpy).toHaveBeenCalledWith(
                'http://custom:9999/v1/chat/completions',
                expect.anything(),
            );
        });

        it('falls back to legacy LM_STUDIO_* env vars', () => {
            delete process.env['RECEIPT_AI_BASE_URL'];
            delete process.env['RECEIPT_AI_MODEL'];
            process.env['LM_STUDIO_BASE_URL'] = 'http://lmstudio:1234';
            process.env['LM_STUDIO_MODEL'] = 'lm-model';
            const svc = new OllamaService();

            const fetchSpy = mockChatCompletionOk({ matchedId: null, confidence: 0 });
            svc.resolveEntityMatch('query', [makeCandidate(1, 'item')]);

            expect(fetchSpy).toHaveBeenCalledWith(
                'http://lmstudio:1234/v1/chat/completions',
                expect.anything(),
            );
        });

        it('falls back to legacy OLLAMA_* env vars', () => {
            delete process.env['RECEIPT_AI_BASE_URL'];
            delete process.env['RECEIPT_AI_MODEL'];
            process.env['OLLAMA_BASE_URL'] = 'http://ollama:11434';
            process.env['OLLAMA_MODEL'] = 'llava';
            const svc = new OllamaService();

            const fetchSpy = mockChatCompletionOk({ matchedId: null, confidence: 0 });
            svc.resolveEntityMatch('query', [makeCandidate(1, 'item')]);

            expect(fetchSpy).toHaveBeenCalledWith(
                'http://ollama:11434/v1/chat/completions',
                expect.anything(),
            );
        });
    });

    // ── resolveEntityMatch ──────────────────────────────────────────────────

    describe('resolveEntityMatch()', () => {
        it('returns parsed matchedId and confidence on success', async () => {
            mockChatCompletionOk({ matchedId: 42, confidence: 0.9 });

            const result = await service.resolveEntityMatch('Biedronka', [makeCandidate(42, 'Biedronka')]);

            expect(result).toEqual({ matchedId: 42, confidence: 0.9 });
        });

        it('returns null on network error', async () => {
            mockFetchError();

            const result = await service.resolveEntityMatch('Biedronka', [makeCandidate(1, 'Lidl')]);

            expect(result).toBeNull();
        });

        it('returns null when server responds with non-OK status', async () => {
            mockFetchNotOk(503);

            const result = await service.resolveEntityMatch('Biedronka', [makeCandidate(1, 'Lidl')]);

            expect(result).toBeNull();
        });

        it('returns null when response body is not valid JSON', async () => {
            jest.spyOn(global, 'fetch').mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue({ choices: [{ message: { content: 'not json at all' } }] }),
            } as unknown as Response);

            const result = await service.resolveEntityMatch('Biedronka', [makeCandidate(1, 'Lidl')]);

            expect(result).toBeNull();
        });

        it('strips markdown code fences before parsing', async () => {
            jest.spyOn(global, 'fetch').mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue({
                    choices: [{ message: { content: '```json\n{"matchedId": 7, "confidence": 0.8}\n```' } }],
                }),
            } as unknown as Response);

            const result = await service.resolveEntityMatch('test', [makeCandidate(7, 'test')]);

            expect(result).toEqual({ matchedId: 7, confidence: 0.8 });
        });

        it('sends request to /v1/chat/completions with messages format', async () => {
            const fetchSpy = mockChatCompletionOk({ matchedId: null, confidence: 0 });

            await service.resolveEntityMatch('query', [makeCandidate(1, 'item')]);

            expect(fetchSpy).toHaveBeenCalledWith(
                `${BASE_URL}/v1/chat/completions`,
                expect.objectContaining({ method: 'POST' }),
            );

            const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
            expect(body.messages).toBeDefined();
            expect(body.messages[0].role).toBe('user');
            expect(body.model).toBe('test-model');
        });

        it('includes each candidate id and name in the prompt', async () => {
            const fetchSpy = mockChatCompletionOk({ matchedId: null, confidence: 0 });

            await service.resolveEntityMatch('query', [makeCandidate(10, 'Biedronka'), makeCandidate(11, 'Lidl')]);

            const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
            const content = body.messages[0].content as string;
            expect(content).toContain('10');
            expect(content).toContain('Biedronka');
            expect(content).toContain('11');
            expect(content).toContain('Lidl');
        });

        it('includes category names in the prompt when provided', async () => {
            const fetchSpy = mockChatCompletionOk({ matchedId: null, confidence: 0 });
            const categories = [makeCategory(1, 'Groceries', TransferTypeEnum.OUTCOME), makeCategory(2, 'Dairy', TransferTypeEnum.OUTCOME)];

            await service.resolveEntityMatch('Mleko', [makeCandidate(1, 'Mleko UHT')], categories);

            const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
            const content = body.messages[0].content as string;
            expect(content).toContain('Groceries');
            expect(content).toContain('Dairy');
        });

        it('does not include category hint when no categories are provided', async () => {
            const fetchSpy = mockChatCompletionOk({ matchedId: null, confidence: 0 });

            await service.resolveEntityMatch('query', [makeCandidate(1, 'item')]);

            const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
            const content = body.messages[0].content as string;
            expect(content).not.toContain('Available categories');
        });

        it('requests json_object response_format when not streaming', async () => {
            const fetchSpy = mockChatCompletionOk({ matchedId: null, confidence: 0 });

            await service.resolveEntityMatch('query', [makeCandidate(1, 'item')]);

            const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
            expect(body.response_format).toEqual({ type: 'json_object' });
            expect(body.stream).toBe(false);
        });
    });

    // ── resolveItemMatchBatch ───────────────────────────────────────────────

    describe('resolveItemMatchBatch()', () => {
        it('returns empty array for empty input', async () => {
            const result = await service.resolveItemMatchBatch([], null, [], []);
            expect(result).toEqual([]);
        });

        it('returns parsed batch results on success', async () => {
            const batchResult = {
                items: [
                    { index: 0, matchedId: 42, confidence: 0.85 },
                    { index: 1, matchedId: null, confidence: 0.3 },
                ],
            };
            mockChatCompletionOk(batchResult);

            const items = [
                { index: 0, ocrName: 'Mleko', price: 3.5, quantity: 1, candidates: [makeCandidate(42, 'Mleko UHT')] },
                { index: 1, ocrName: 'Unknown', price: 1.0, quantity: 1, candidates: [] },
            ];

            const result = await service.resolveItemMatchBatch(items, 'Biedronka', ['Groceries'], ['Mleko UHT']);

            expect(result).toEqual(batchResult.items);
        });

        it('returns null when response has no items array', async () => {
            mockChatCompletionOk({ notItems: [] });

            const items = [{ index: 0, ocrName: 'test', price: 1, quantity: 1, candidates: [] }];
            const result = await service.resolveItemMatchBatch(items, null, [], []);

            expect(result).toBeNull();
        });

        it('returns null on network error', async () => {
            mockFetchError();

            const items = [{ index: 0, ocrName: 'test', price: 1, quantity: 1, candidates: [] }];
            const result = await service.resolveItemMatchBatch(items, null, [], []);

            expect(result).toBeNull();
        });
    });

    // ── isAvailable ─────────────────────────────────────────────────────────

    describe('isAvailable()', () => {
        it('checks the /v1/models endpoint', async () => {
            const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: true } as Response);

            await service.isAvailable();

            expect(fetchSpy).toHaveBeenCalledWith(`${BASE_URL}/v1/models`, expect.anything());
        });

        it('returns false when the endpoint is unreachable', async () => {
            mockFetchError();
            expect(await service.isAvailable()).toBe(false);
        });
    });
});
