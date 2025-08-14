import { Injectable } from '@angular/core';
import { CoinageSocketNamespace } from '@app/common';
import { Socket } from 'ngx-socket-io';

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
