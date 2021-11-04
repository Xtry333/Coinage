import { Component, OnInit } from '@angular/core';
import { BalanceDTO } from '@coinage-app/interfaces';
import { CoinageDataService } from '../../services/coinageData.service';

@Component({
    selector: 'coinage-app-dashboard-counters',
    templateUrl: './dashboard-counters.component.html',
    styleUrls: ['./dashboard-counters.component.scss'],
})
export class DashboardCountersComponent implements OnInit {
    balance: BalanceDTO[] = [];

    constructor(private readonly coinageData: CoinageDataService) {}

    ngOnInit(): void {
        this.loadData();
    }

    public refreshData(): void {
        this.loadData();
    }

    private loadData(): void {
        this.coinageData.getBalanceForActiveAccounts().subscribe((res) => (this.balance = res));
    }

    trackByAccountId(index: number, item: BalanceDTO) {
        return item.accountId;
    }
}
