export class MockCoinageStorageService {
    get = jest.fn(() => null);
    set = jest.fn();
    remove = jest.fn();
    clear = jest.fn();
    attachEventListener = jest.fn();
    detachEventListener = jest.fn();
    getObject = jest.fn(() => null);
    getBoolean = jest.fn(() => false);
    getString = jest.fn(() => null);
    getNumber = jest.fn(() => 0);
    setObject = jest.fn();
    setBoolean = jest.fn();
    setString = jest.fn();
    setNumber = jest.fn();
    getAll = jest.fn(() => ({}));
    has = jest.fn(() => false);

    static KEY_OBJECT_TEMPLATE = (key: string) => key;
}

export const COINAGE_STORAGE_SERVICE_KEY_OBJECT_TEMPLATE = (key: string) => key;
