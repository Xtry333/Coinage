import { Component, OnInit } from '@angular/core';

import { CoinageDataService } from '../../services/coinage.data-service';

@Component({
    selector: 'app-account-details-page',
    templateUrl: './account-details-page.component.html',
    styleUrls: ['./account-details-page.component.scss'],
})
export class AccountDetailsPage implements OnInit {
    public constructor(private readonly dataService: CoinageDataService) {}

    public ngOnInit(): void {}
}
