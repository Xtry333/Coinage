import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class SocketService {
    public constructor(private readonly socket: Socket) {}

    public fromEvent<T>(event: string): Observable<T> {
        return this.socket.fromEvent<T>(event);
    }
}
