import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface CoinageNotification {
    id: number;
    title: string;
    message: string;
    autoCloseDelay?: number;
    linkTo?: string;
}

export type NewNotification = Omit<CoinageNotification, 'id'>;

@Injectable({
    providedIn: 'root',
})
export class NotificationService {
    public static readonly DEFAULT_CLOSE_DELAY = 15000;
    private idCounter = 0;

    private incomingNotifications = new Subject<CoinageNotification>();

    public readonly notifications$ = this.incomingNotifications.asObservable();

    // constructor() {
    //     console.log(this);
    // }

    push(notification: NewNotification): number {
        const n = {
            ...notification,
            id: this.idCounter++,
            autoCloseDelay: notification.autoCloseDelay ?? NotificationService.DEFAULT_CLOSE_DELAY,
        };
        this.incomingNotifications.next(n);
        return n.id;
    }
}
