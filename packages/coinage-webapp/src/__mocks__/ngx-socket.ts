export class Socket {
    constructor(options?: any) {}
    connect = jest.fn(() => ({ subscribe: jest.fn() }));
    emit = jest.fn();
    fromEvent = jest.fn(() => ({ subscribe: jest.fn() }));
    removeListener = jest.fn();
    on = jest.fn();
    ioSocket = { id: 'test' };
}

export const SocketIoModule = {};
export const SocketIoConfig = {};
