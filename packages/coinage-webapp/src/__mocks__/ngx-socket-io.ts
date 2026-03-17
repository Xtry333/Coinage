export class MockSocket {
    connect = jest.fn(() => ({ subscribe: jest.fn() }));
    emit = jest.fn();
    fromEvent = jest.fn(() => ({ subscribe: jest.fn() }));
    removeListener = jest.fn();
    on = jest.fn();
    ioSocket = { id: 'test' };
}

export const MockSocketIoModule = {};
export const MockSocketIoConfig = {};
