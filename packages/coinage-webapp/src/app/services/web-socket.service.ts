import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class WebSocketService {
    public constructor(private readonly socket: Socket) {
        console.log(socket.ioSocket);
        this.socket.on('debug', (msg: any) => {
            console.log(msg);
        });
    }

    public on(event: string): Observable<{ [key: string]: any }> {
        const subject = new BehaviorSubject({});
        this.socket.on(event, (msg: any) => {
            subject.next(msg);
        });
        return subject.asObservable();
    }

    public emitW(event: string, data: any, callback?: any) {
        return this.socket.emit(event, data, callback);
    }

    public emit<T, V>(event: string, data: V): Promise<T> {
        return new Promise((resolve) => {
            this.socket.emit(event, data, (response: T) => {
                resolve(response);
            });
        });
    }
}
