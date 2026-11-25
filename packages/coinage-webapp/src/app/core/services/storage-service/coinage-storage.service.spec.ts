import { CoinageStorageService } from './coinage-storage.service';
import { StorageScope } from './storage-scope.enum';

describe('CoinageStorageService', () => {
    const key = 'test.coinage-storage.boolean';
    const storedKey = CoinageStorageService.KEY_BOOLEAN_TEMPLATE(key);
    let service: CoinageStorageService;

    beforeEach(() => {
        // Use the real storage implementation, not the shared TestBed mock.
        service = new CoinageStorageService();
        window.localStorage.removeItem(storedKey);
        window.sessionStorage.removeItem(storedKey);
    });

    afterEach(() => {
        window.localStorage.removeItem(storedKey);
        window.sessionStorage.removeItem(storedKey);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe.each([
        { name: 'persistent', scope: StorageScope.Persistent },
        { name: 'session', scope: StorageScope.Session },
    ])('$name booleans', ({ scope }) => {
        it.each([true, false])('restores %s when the storage service is recreated', (value) => {
            service.setBoolean(key, value, scope);

            expect(new CoinageStorageService().getBoolean(key, scope)).toBe(value);
        });

        it('returns undefined for an unset preference', () => {
            expect(service.getBoolean(key, scope)).toBeUndefined();
        });

        it('removes a saved preference when set to undefined', () => {
            service.setBoolean(key, false, scope);
            service.setBoolean(key, undefined, scope);

            expect(new CoinageStorageService().getBoolean(key, scope)).toBeUndefined();
        });
    });

    it('keeps persistent and session boolean values independent', () => {
        service.setBoolean(key, true);
        service.setBoolean(key, false, StorageScope.Session);
        const restored = new CoinageStorageService();

        expect(restored.getBoolean(key)).toBe(true);
        expect(restored.getBoolean(key, StorageScope.Session)).toBe(false);
    });
});
