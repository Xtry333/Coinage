import { Component, OnInit } from '@angular/core';
import { TotalOutcomesPerMonthDTO, TransferDTO } from '@coinage-app/interfaces';
import { CoinageDataService } from '../coinageData.service';
import { finalize } from 'rxjs/operators';
import { DateTime } from 'luxon';
import * as Rx from 'rxjs';

interface UiTotalOutcomesPerMonth {
    date: string;
    year: number;
    monthName: string;
    amount: number;
    transactionsCount: number;
}

@Component({
    selector: 'coinage-app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.less'],
})
export class DashboardComponent implements OnInit {
    message: string = '';
    transactionId: number = 0;
    lastTransactions: TransferDTO[];
    totalOutcomesPerMonth: UiTotalOutcomesPerMonth[];
    showPage = false;

    constructor(private readonly coinageData: CoinageDataService) {}

    ngOnInit(): void {
        this.showPage = false;
        const data = Rx.zip(this.coinageData.getTransactionsObserver(), this.coinageData.getTotalOutcomesPerMonth());
        data.pipe(
            finalize(() => {
                this.showPage = true;
            })
        ).subscribe((values) => {
            this.lastTransactions = values[0];
            this.totalOutcomesPerMonth = this.mapToUiOutcome(values[1]);
        });
    }

    private mapToUiOutcome(totalOutcomes: TotalOutcomesPerMonthDTO[]): UiTotalOutcomesPerMonth[] {
        return totalOutcomes.map((outcome) => {
            return {
                year: outcome.year,
                date: outcome.year + '-' + (outcome.month + 1),
                monthName: new Date(outcome.year, outcome.month).toLocaleString('pl', { month: 'long' }),
                amount: outcome.amount,
                transactionsCount: outcome.transactionsCount,
            };
        });
    }
}
