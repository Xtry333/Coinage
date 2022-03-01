import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { faExternalLinkAlt, faTimes } from '@fortawesome/free-solid-svg-icons';
import { CoinageNotification, NotificationLevel } from '../../services/notification.service';

@Component({
    selector: 'coinage-app-notification',
    templateUrl: './notification.component.html',
    styleUrls: ['./notification.component.scss'],
})
export class NotificationComponent implements OnInit, OnDestroy {
    public closeIcon = faTimes;
    public gotoIcon = faExternalLinkAlt;

    private closeTimeout?: ReturnType<typeof setTimeout>;

    @Input() content!: CoinageNotification;

    @Output() dismissedEvent = new EventEmitter<number>();

    ngOnInit(): void {
        if (this.content.autoCloseDelay ?? 0 > 0) {
            this.closeTimeout = setTimeout(this.dismiss, this.content.autoCloseDelay);
        }
    }

    ngOnDestroy(): void {
        this.dismiss();
    }

    dismiss = () => {
        if (this.closeTimeout) {
            clearTimeout(this.closeTimeout);
        }
        this.dismissedEvent.emit(this.content.id);
    };

    get displayGoToIcon(): boolean {
        return !!this.content.linkTo;
    }

    get classLevel(): string {
        switch (this.content.level) {
            default:
            case NotificationLevel.Info:
                return 'info';
            case NotificationLevel.Warning:
                return 'warning';
            case NotificationLevel.Error:
                return 'error';
        }
    }

    get isError(): boolean {
        return this.content.level === NotificationLevel.Error;
    }
}
