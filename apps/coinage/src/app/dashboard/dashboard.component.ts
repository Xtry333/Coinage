import { Component, OnDestroy, OnInit } from '@angular/core';
import { TotalOutcomesPerMonthDTO, TransferDTO } from '@coinage-app/interfaces';
import { CoinageDataService } from '../services/coinageData.service';
import { finalize } from 'rxjs/operators';
import * as Rx from 'rxjs';
import { DateParserService, PartedDate } from '../services/date-parser.service';

interface UiTotalOutcomesPerMonth {
    date: string;
    year: number;
    monthName: string;
    partedDate: PartedDate;
    amount: number;
    transactionsCount: number;
    costPerDay: number;
}

@Component({
    selector: 'coinage-app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.less'],
})
export class DashboardComponent implements OnInit, OnDestroy {
    public static REFRESH_INTERVAL = 10000;
    message = '';
    transactionId = 0;
    lastTransactions: TransferDTO[] = [];
    totalOutcomesPerMonth: UiTotalOutcomesPerMonth[] = [];
    showPage = false;
    refreshInterval?: ReturnType<typeof setInterval>;

    constructor(private readonly coinageData: CoinageDataService, private readonly partedDateService: DateParserService) {}

    ngOnInit(): void {
        this.showPage = false;
        const data = Rx.zip(this.coinageData.getRecentTransactions(), this.coinageData.getTotalOutcomesPerMonth());
        data.pipe(
            finalize(() => {
                this.showPage = true;
            })
        ).subscribe((values) => {
            this.lastTransactions = values[0];
            this.totalOutcomesPerMonth = this.mapToUiOutcome(values[1]);
        });
        this.refreshInterval = setInterval(() => this.refreshData(), DashboardComponent.REFRESH_INTERVAL);
    }

    ngOnDestroy(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = undefined;
        }
    }

    public transferIdTracker(index: number, item: TransferDTO): string {
        return item.id.toString();
    }

    public totalOutcomesTracker(index: number, item: UiTotalOutcomesPerMonth): string {
        if (item.partedDate.month) {
            return item.partedDate.year.toString() + item.partedDate.month.toString();
        }
        return '';
    }

    public addTransferBeforeRefresh(transfer: TransferDTO) {
        this.lastTransactions.unshift(transfer);
        this.lastTransactions.splice(10, 1);
    }

    public refreshData() {
        Rx.zip(this.coinageData.getRecentTransactions(), this.coinageData.getTotalOutcomesPerMonth()).subscribe(([transactions, outcomes]) => {
            this.lastTransactions = transactions;
            this.totalOutcomesPerMonth = this.mapToUiOutcome(outcomes);
        });
    }

    private mapToUiOutcome(totalOutcomes: TotalOutcomesPerMonthDTO[]): UiTotalOutcomesPerMonth[] {
        return totalOutcomes.map((outcome) => {
            return {
                year: outcome.year,
                date: outcome.year + '-' + (outcome.month + 1),
                monthName: new Date(outcome.year, outcome.month).toLocaleString('pl', { month: 'long' }),
                partedDate: { year: outcome.year, month: outcome.month + 1 },
                amount: outcome.amount,
                transactionsCount: outcome.transactionsCount,
                costPerDay: outcome.amount / this.daysInMonth(outcome.year, outcome.month),
            };
        });
    }

    private daysInMonth(year: number, month: number): number {
        const today = new Date();
        if (today.getFullYear() == year && today.getMonth() == month) {
            return today.getDate();
        }
        return new Date(year, month + 1, 0).getDate();
    }

    public formatDate(date: string): string {
        return this.partedDateService.formatDate(new Date(date));
    }

    public getTotalPerMonthDate(uiRow: UiTotalOutcomesPerMonth): string {
        return this.partedDateService.joinPartedDate(uiRow.partedDate);
    }
}