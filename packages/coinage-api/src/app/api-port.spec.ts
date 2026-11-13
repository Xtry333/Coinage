import { getApiPort } from './api-port';

describe('API listening port', () => {
    function resolve(environment: Record<string, string | undefined>): number {
        return getApiPort((name) => environment[name]);
    }

    it('defaults to 3333 for missing or empty values', () => {
        expect(resolve({})).toBe(3333);
        expect(resolve({ COINAGE_API_PORT: '', PORT: '' })).toBe(3333);
    });

    it('prefers COINAGE_API_PORT over the legacy PORT', () => {
        expect(resolve({ COINAGE_API_PORT: '13333', PORT: '19999' })).toBe(13333);
    });

    it('retains PORT as a fallback for existing native setups', () => {
        expect(resolve({ PORT: '13334' })).toBe(13334);
        expect(resolve({ COINAGE_API_PORT: '', PORT: '13334' })).toBe(13334);
    });

    it.each(['0', '-1', '65536', '1.5', '3333junk', 'not-a-port', ' '])('rejects invalid ports: %s', (value) => {
        expect(() => resolve({ COINAGE_API_PORT: value })).toThrow(/COINAGE_API_PORT/);
        expect(() => resolve({ PORT: value })).toThrow(/PORT/);
    });
});
