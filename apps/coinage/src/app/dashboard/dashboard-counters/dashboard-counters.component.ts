import { Component, OnInit } from '@angular/core';

import { BalanceDTO } from '@coinage-app/interfaces';
import { CoinageDataService } from '../../services/coinage.data-service';

@Component({
    selector: 'coinage-app-dashboard-counters',
    templateUrl: './dashboard-counters.component.html',
    styleUrls: ['./dashboard-counters.component.scss'],
})
export class DashboardCountersComponent implements OnInit {
    public balance: BalanceDTO[] = [];
    public todaySpendings = 0;
    public sumPkoWilla = 0;

    public constructor(private readonly coinageData: CoinageDataService) {}

    public ngOnInit(): void {
        this.loadData();
    }

    public refreshData(): void {
        this.loadData();
    }

    private loadData(): void {
        const date = new Date();
        this.coinageData
            .getBalanceForActiveAccounts(date)
            .subscribe((res) => ((this.balance = res), (this.sumPkoWilla = this.balance[0].balance + this.balance[1].balance)));
        this.coinageData.getTodaySpendings(date).subscribe((res) => (this.todaySpendings = res.reduce((acc, cur) => acc + cur.balance, 0)));
    }

    public trackByAccountId(index: number, item: BalanceDTO) {
        return item.accountId;
    }
}
