import { Component, ElementRef, EventEmitter, HostListener, OnDestroy, OnInit, Output } from '@angular/core';
import { faCheck, faExternalLinkAlt, faHistory, faTimes, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Subject, takeUntil } from 'rxjs';

import { CoinageNotification, NotificationService } from '../../services/notification.service';

@Component({
    selector: 'app-notifications-dropdown',
    templateUrl: './notifications-dropdown.component.html',
    styleUrls: ['./notifications-dropdown.component.scss'],
    standalone: false,
})
export class NotificationsDropdownComponent implements OnInit, OnDestroy {
    public closeIcon = faTimes;
    public historyIcon = faHistory;
    public checkIcon = faCheck;
    public linkIcon = faExternalLinkAlt;
    public trashIcon = faTrash;

    public isOpen = false;
    public historicalNotifications: CoinageNotification[] = [];

    @Output() public toggleDropdown = new EventEmitter<void>();
    @Output() public closeDropdown = new EventEmitter<void>();

    private destroy$ = new Subject<void>();

    public constructor(
        private readonly notificationService: NotificationService,
        private readonly elementRef: ElementRef,
    ) {}

    public ngOnInit(): void {
        this.loadHistoricalNotifications();
        this.notificationService.historicalNotifications$.pipe(takeUntil(this.destroy$)).subscribe((notifications) => {
            this.historicalNotifications = notifications;
        });
    }

    public ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    @HostListener('document:mousedown', ['$event'])
    public handleMousedown($event: MouseEvent): void {
        if (this.isOpen) {
            const target = $event.target as HTMLElement;
            if (!this.elementRef.nativeElement.contains(target)) {
                this.close();
            }
        }
    }

    public toggle(): void {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.loadHistoricalNotifications();
        }
        this.toggleDropdown.emit();
    }

    public close(): void {
        this.isOpen = false;
        this.closeDropdown.emit();
    }

    public onClearHistory(): void {
        this.notificationService.clearHistoricalNotifications();
        this.historicalNotifications = [];
    }

    public onMarkAsRead(notification: CoinageNotification): void {
        this.notificationService.markNotificationAsRead(notification.id);
    }

    private loadHistoricalNotifications(): void {
        this.historicalNotifications = this.notificationService.getHistoricalNotifications();
    }

    public formatTimestamp(timestamp?: string): string {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInDays < 7) return `${diffInDays}d ago`;

        return date.toLocaleDateString();
    }

    public getNotificationLevelClass(notification: CoinageNotification): string {
        switch (notification.level) {
            case 2: // Error
                return 'border-l-red-500 bg-red-50';
            case 1: // Warning
                return 'border-l-yellow-500 bg-yellow-50';
            default: // Info
                return 'border-l-blue-500 bg-blue-50';
        }
    }
}
