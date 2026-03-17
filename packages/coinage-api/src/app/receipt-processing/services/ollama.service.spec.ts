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

/** Simulate a successful LM Studio OpenAI-compatible API response */
function mockLMStudioFetchOk(body: object) {
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

// ─── OllamaService ────────────────────────────────────────────────────────────

describe('OllamaService', () => {
    afterEach(() => {
        jest.restoreAllMocks();
        delete process.env['RECEIPT_AI_PROVIDER'];
        delete process.env['OLLAMA_BASE_URL'];
        delete process.env['OLLAMA_MODEL'];
        delete process.env['LM_STUDIO_BASE_URL'];
        delete process.env['LM_STUDIO_MODEL'];
    });

    // ── Ollama provider ────────────────────────────────────────────────────────

    describe('Ollama provider (default)', () => {
        let service: OllamaService;

        beforeEach(() => {
            process.env['OLLAMA_BASE_URL'] = OLLAMA_BASE_URL;
            process.env['OLLAMA_MODEL'] = 'llava';
            // RECEIPT_AI_PROVIDER not set → defaults to 'ollama'
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
                expect(body.prompt).toContain('id 10');
                expect(body.prompt).toContain('Biedronka');
                expect(body.prompt).toContain('id 11');
                expect(body.prompt).toContain('Lidl');
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

            it('requests json_object response_format', async () => {
                const fetchSpy = mockLMStudioFetchOk({ matchedId: null, confidence: 0 });

                await service.resolveEntityMatch('query', [makeCandidate(1, 'item')]);

                const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
                expect(body.response_format).toEqual({ type: 'json_object' });
            });

            it('includes candidate ids and names in the message content', async () => {
                const fetchSpy = mockLMStudioFetchOk({ matchedId: null, confidence: 0 });

                await service.resolveEntityMatch('Biedronka', [makeCandidate(10, 'Biedronka'), makeCandidate(11, 'Lidl')]);

                const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
                const content = body.messages[0].content as string;
                expect(content).toContain('id 10');
                expect(content).toContain('Biedronka');
                expect(content).toContain('id 11');
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
});
