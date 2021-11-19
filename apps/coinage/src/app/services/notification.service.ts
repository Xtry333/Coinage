import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { CoinageLocalStorageService } from './coinage-local-storage.service';

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
    public static readonly NOTIFICATION_KEY = 'notification';
    public static readonly DEFAULT_CLOSE_DELAY = 15000;
    private idCounter = 0;

    private incomingNotifications = new Subject<CoinageNotification>();

    public readonly notifications$ = this.incomingNotifications.asObservable();

    constructor(private readonly coinageLocalStorageService: CoinageLocalStorageService) {
        window.addEventListener(
            'storage',
            (event) => {
                if (event.key === CoinageLocalStorageService.KEY_OBJECT_TEMPLATE(NotificationService.NOTIFICATION_KEY)) {
                    const sharedNofitication = this.coinageLocalStorageService.getObject<CoinageNotification>(NotificationService.NOTIFICATION_KEY);
                    if (sharedNofitication) {
                        this.incomingNotifications.next(this.buildNotification(sharedNofitication));
                    }
                }
            },
            true
        );

        console.log(this);
    }

    push(newNotification: NewNotification): number {
        const notification = this.buildNotification(newNotification);
        this.incomingNotifications.next(notification);
        this.coinageLocalStorageService.setObject(NotificationService.NOTIFICATION_KEY, notification);
        return notification.id;
    }

    private buildNotification(notification: NewNotification): CoinageNotification {
        return {
            ...notification,
            id: this.idCounter++,
            autoCloseDelay: notification.autoCloseDelay ?? NotificationService.DEFAULT_CLOSE_DELAY,
        };
    }
}
