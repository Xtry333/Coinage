import { makeCategory } from '@coinage-app/test/mock-generators/receipt-normalization.mock';
import { TransferTypeEnum } from '../../entities/Category.entity';
import { OllamaService } from './ollama.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const OLLAMA_BASE_URL = 'http://localhost:11434';

function makeCandidate(id: number, name: string, score = 0.8) {
    return { id, name, score };
}

function mockFetchOk(responseBody: object) {
    return jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ response: JSON.stringify(responseBody) }),
    } as unknown as Response);
}

function mockFetchError() {
    return jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));
}

function mockFetchNotOk(status = 500) {
    return jest.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: false, status } as unknown as Response);
}

// ─── OllamaService.resolveEntityMatch ─────────────────────────────────────────

describe('OllamaService', () => {
    let service: OllamaService;

    beforeEach(() => {
        process.env['OLLAMA_BASE_URL'] = OLLAMA_BASE_URL;
        process.env['OLLAMA_MODEL'] = 'llava';
        service = new OllamaService();
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('resolveEntityMatch()', () => {
        it('returns parsed matchedId and confidence on success', async () => {
            mockFetchOk({ matchedId: 42, confidence: 0.9 });

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

        it('strips markdown code fences from response before parsing', async () => {
            jest.spyOn(global, 'fetch').mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue({ response: '```json\n{"matchedId": 7, "confidence": 0.8}\n```' }),
            } as unknown as Response);

            const result = await service.resolveEntityMatch('test', [makeCandidate(7, 'test')]);

            expect(result).toEqual({ matchedId: 7, confidence: 0.8 });
        });

        it('sends request to the correct Ollama API endpoint', async () => {
            const fetchSpy = mockFetchOk({ matchedId: null, confidence: 0 });

            await service.resolveEntityMatch('query', [makeCandidate(1, 'item')]);

            expect(fetchSpy).toHaveBeenCalledWith(
                `${OLLAMA_BASE_URL}/api/generate`,
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('includes each candidate id and name in the prompt body', async () => {
            const fetchSpy = mockFetchOk({ matchedId: null, confidence: 0 });
            const candidates = [makeCandidate(10, 'Biedronka'), makeCandidate(11, 'Lidl')];

            await service.resolveEntityMatch('query', candidates);

            const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
            expect(body.prompt).toContain('id 10');
            expect(body.prompt).toContain('Biedronka');
            expect(body.prompt).toContain('id 11');
            expect(body.prompt).toContain('Lidl');
        });

        it('includes category names in the prompt when categories are provided', async () => {
            const fetchSpy = mockFetchOk({ matchedId: null, confidence: 0 });
            const categories = [makeCategory(1, 'Groceries', TransferTypeEnum.OUTCOME), makeCategory(2, 'Dairy', TransferTypeEnum.OUTCOME)];

            await service.resolveEntityMatch('Mleko', [makeCandidate(1, 'Mleko UHT')], categories);

            const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
            expect(body.prompt).toContain('Groceries');
            expect(body.prompt).toContain('Dairy');
        });

        it('does not include a category hint when no categories are provided', async () => {
            const fetchSpy = mockFetchOk({ matchedId: null, confidence: 0 });

            await service.resolveEntityMatch('query', [makeCandidate(1, 'item')]);

            const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
            expect(body.prompt).not.toContain('Available categories');
        });

        it('requests json format from Ollama', async () => {
            const fetchSpy = mockFetchOk({ matchedId: null, confidence: 0 });

            await service.resolveEntityMatch('query', [makeCandidate(1, 'item')]);

            const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
            expect(body.format).toBe('json');
            expect(body.stream).toBe(false);
        });
    });
});
