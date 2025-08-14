import { Component, OnInit } from '@angular/core';

import { AccountDTO } from '@app/interfaces';

import { CoinageDataService } from '../../services/coinage.data-service';

@Component({
    selector: 'app-account-settings-page',
    templateUrl: './account-settings-page.component.html',
    styleUrls: ['./account-settings-page.component.scss'],
    standalone: false,
})
export class AccountSettingsPageComponent implements OnInit {
    public accounts: AccountDTO[] = [];

    public constructor(private readonly dataService: CoinageDataService) {}

    public ngOnInit(): void {
        this.dataService.getUserAccounts().then((accounts) => {
            this.accounts = accounts;
        });
    }
}
