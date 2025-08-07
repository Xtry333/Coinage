import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

import { CoinageDataService } from '../../services/coinage.data-service';
import { NotificationService } from '../../services/notification.service';

@Component({
    selector: 'app-account-details-page',
    templateUrl: './account-details-page.component.html',
    styleUrls: ['./account-details-page.component.scss'],
})
export class AccountDetailsPage implements OnInit {
    private val = false;
    public locked = false;

    public constructor(
        private readonly dataService: CoinageDataService,
        private readonly notificationService: NotificationService,
    ) {
        console.log(this);
    }

    public ngOnInit(): void {}

    set checkedValue(value: boolean) {
        this.val = value;
        if (this.locked) {
            setTimeout(() => {
                this.val = !value;
                this.notificationService.push({ title: 'Value is locked', message: `You cannot change the locked value from ${this.checkedValue}` });
            });
        }
    }

    get checkedValue(): boolean {
        return this.val;
    }
}
