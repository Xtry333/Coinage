import { Component, OnInit } from '@angular/core';
import { CoinageDataService } from '../../services/coinageData.service';

@Component({
    selector: 'coinage-app-dashboard-counters',
    templateUrl: './dashboard-counters.component.html',
    styleUrls: ['./dashboard-counters.component.scss'],
})
export class DashboardCountersComponent implements OnInit {
    balance = 0;

    constructor(private readonly coinageData: CoinageDataService) {}

    ngOnInit(): void {
        this.coinageData.getBalanceForActiveAccounts().subscribe((value) => (this.balance = value[0].balance));
    }
}
