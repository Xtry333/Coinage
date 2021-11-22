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
    public static readonly LAST_NOTIFICATION_ID_KEY = 'last-notification-id';
    public static readonly NOTIFICATION_KEY = 'notification';
    public static readonly MAX_NOTIFICATION_ID = 65535;
    public static readonly DEFAULT_AUTOCLOSE_DELAY_MS = 15000;

    private incomingNotifications = new Subject<CoinageNotification>();

    public readonly notifications$ = this.incomingNotifications.asObservable();

    constructor(private readonly localStorageService: CoinageLocalStorageService) {
        localStorageService.attachEventListener((event) => {
            if (event.key === CoinageLocalStorageService.KEY_OBJECT_TEMPLATE(NotificationService.NOTIFICATION_KEY)) {
                const sharedNofitication = this.localStorageService.getObject<CoinageNotification>(NotificationService.NOTIFICATION_KEY);
                if (sharedNofitication) {
                    this.incomingNotifications.next(this.buildNotification(sharedNofitication, sharedNofitication.id));
                }
            }
        });

        console.log(this);
    }

    push(newNotification: NewNotification): number {
        const notification = this.buildNotification(newNotification);
        this.incomingNotifications.next(notification);
        this.localStorageService.setObject(NotificationService.NOTIFICATION_KEY, notification);
        return notification.id;
    }

    private buildNotification(notification: NewNotification, id?: number): CoinageNotification {
        return {
            ...notification,
            id: id ? id : this.newNotificationId,
            autoCloseDelay: notification.autoCloseDelay ?? NotificationService.DEFAULT_AUTOCLOSE_DELAY_MS,
        };
    }

    private get newNotificationId(): number {
        const lastId = this.localStorageService.getNumber(NotificationService.LAST_NOTIFICATION_ID_KEY) ?? 0;
        const newId = lastId >= NotificationService.MAX_NOTIFICATION_ID ? 1 : lastId + 1;
        this.localStorageService.setNumber(NotificationService.LAST_NOTIFICATION_ID_KEY, newId);
        return newId;
    }
}
