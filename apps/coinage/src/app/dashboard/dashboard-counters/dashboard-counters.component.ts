import { Component, OnInit } from '@angular/core';
import { BalanceDTO } from '@coinage-app/interfaces';
import { CoinageDataService } from '../../services/coinage.dataService';

@Component({
    selector: 'coinage-app-dashboard-counters',
    templateUrl: './dashboard-counters.component.html',
    styleUrls: ['./dashboard-counters.component.scss'],
})
export class DashboardCountersComponent implements OnInit {
    balance: BalanceDTO[] = [];
    todaySpendings = 0;

    constructor(private readonly coinageData: CoinageDataService) {}

    ngOnInit(): void {
        this.loadData();
    }

    public refreshData(): void {
        this.loadData();
    }

    private loadData(): void {
        this.coinageData.getBalanceForActiveAccounts().subscribe((res) => (this.balance = res));
        this.coinageData.getTodaySpendings().subscribe((res) => (this.todaySpendings = res.reduce((acc, cur) => acc + cur.balance, 0)));
    }

    trackByAccountId(index: number, item: BalanceDTO) {
        return item.accountId;
    }
}
