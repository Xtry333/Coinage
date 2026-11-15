import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';

import { CoinageSocketNamespace } from '@app/common';

@Injectable({
    providedIn: 'root',
})
export class CoinageSocketService {
    public constructor(private readonly socket: Socket) {}

    public send(namespace: CoinageSocketNamespace): boolean {
        this.socket.emit(namespace, 'Hello world!');
        return true;
    }
}
