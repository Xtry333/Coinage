import { Component, OnDestroy, OnInit } from '@angular/core';
import { TotalAmountPerMonthDTO, TransferDTO } from '@coinage-app/interfaces';
import { CoinageDataService } from '../services/coinageData.service';
import { finalize } from 'rxjs/operators';
import * as Rx from 'rxjs';
import { DateParserService, PartedDate } from '../services/date-parser.service';

interface UiTotalAmountPerMonth {
    date: string;
    year: number;
    monthName: string;
    partedDate: PartedDate;
    incomes: number;
    outcomes: number;
    transactionsCount: number;
    costPerDay: number;
}

@Component({
    selector: 'coinage-app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
    public static REFRESH_INTERVAL = 10000;
    message = '';
    transactionId = 0;
    lastTransactions: TransferDTO[] = [];
    totalAmountPerMonth: UiTotalAmountPerMonth[] = [];
    showPage = false;
    refreshInterval?: ReturnType<typeof setInterval>;
    averageAmountLimit = 5;

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
            this.totalAmountPerMonth = this.mapToUiOutcome(values[1]);
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

    public totalOutcomesTracker(index: number, item: UiTotalAmountPerMonth): string {
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
            this.totalAmountPerMonth = this.mapToUiOutcome(outcomes);
        });
    }

    private mapToUiOutcome(totalOutcomes: TotalAmountPerMonthDTO[]): UiTotalAmountPerMonth[] {
        return totalOutcomes.map((total) => {
            return {
                year: total.year,
                date: total.year + '-' + (total.month + 1),
                monthName: new Date(total.year, total.month).toLocaleString('pl', { month: 'long' }),
                partedDate: { year: total.year, month: total.month + 1 },
                outcomes: total.outcomes,
                incomes: total.incomes,
                transactionsCount: total.transactionsCount,
                costPerDay: total.outcomes / this.daysInMonth(total.year, total.month),
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

    public getTotalPerMonthDate(uiRow: UiTotalAmountPerMonth): string {
        return this.partedDateService.joinPartedDate(uiRow.partedDate);
    }

    get rollingAverageIncomes() {
        return this.totalAmountPerMonth.slice(0, this.averageAmountLimit).reduce((a, i) => a + i.incomes, 0) / this.averageAmountLimit;
    }

    get rollingAverageOutcomes() {
        return this.totalAmountPerMonth.slice(0, this.averageAmountLimit).reduce((a, i) => a + i.outcomes, 0) / this.averageAmountLimit;
    }
}
