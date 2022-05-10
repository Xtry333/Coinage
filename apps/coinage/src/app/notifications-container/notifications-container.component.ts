import { Component, OnInit } from '@angular/core';
import { CoinageNotification, NotificationService } from '../services/notification.service';

@Component({
    selector: 'coinage-app-notifications-container',
    templateUrl: './notifications-container.component.html',
    styleUrls: ['./notifications-container.component.scss'],
})
export class NotificationsContainerComponent implements OnInit {
    public notificationsList: CoinageNotification[] = [];

    public constructor(private readonly notificationService: NotificationService) {}

    public ngOnInit(): void {
        this.notificationService.notifications$.subscribe((notification) => {
            this.notificationsList.push(notification);
        });
        // this.notificationService.push({ title: 'Test', message: 'Test Notification. Quite long message added to the notification for testing purposes.', autoCloseDelay: 0 });
    }

    public onNotificationDismiss(id: number) {
        const index = this.notificationsList.findIndex((n) => n.id === id);
        if (index >= 0) {
            this.notificationsList.splice(index, 1);
        }
    }
}
