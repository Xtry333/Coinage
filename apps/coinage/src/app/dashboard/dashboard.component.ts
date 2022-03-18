import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { TotalAmountPerMonthDTO, TransferDTO } from '@coinage-app/interfaces';
import { ChartDataset, ChartOptions } from 'chart.js';
import * as Rx from 'rxjs';
import { finalize } from 'rxjs/operators';

import { CoinageDataService } from '../services/coinage.dataService';
import { DateParserService, PartedDate } from '../services/date-parser.service';
import { NavigatorPages } from '../services/navigator.service';
import { DashboardCountersComponent } from './dashboard-counters/dashboard-counters.component';

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
    public static readonly REFRESH_INTERVAL = 10000;

    public NavigatorPages = NavigatorPages;

    public accountStatsChartData: ChartDataset[] = [
        { data: [], label: 'Outcomes' },
        { data: [], label: 'Incomes' },
        { data: [], label: 'Balance' },
    ];

    public accountStatsChartLabels: string[] = [];

    public lineChartOptions: ChartOptions = {
        responsive: true,
        onClick: (event, activeElements) => console.log(activeElements[0]?.datasetIndex, activeElements[0]?.index),
    };

    message = '';
    transactionId = 0;
    lastTransactions: TransferDTO[] = [];
    totalAmountPerMonth: UiTotalAmountPerMonth[] = [];
    showPage = false;
    refreshInterval?: ReturnType<typeof setInterval>;
    averageAmountLimit = 5;
    balanceMainAccount = 0;
    balanceSecondary = 0;
    dataOld = false;

    @ViewChild(DashboardCountersComponent)
    countersComponent!: DashboardCountersComponent;

    constructor(private readonly coinageData: CoinageDataService, private readonly partedDateService: DateParserService) {}

    ngOnInit(): void {
        console.log(this);
        this.showPage = false;
        this.refreshData();
        // const data = Rx.zip(this.coinageData.getRecentTransactions(), this.coinageData.getTotalOutcomesPerMonth());
        // data.pipe(
        //     finalize(() => {
        //         this.showPage = true;
        //     })
        // ).subscribe((values) => {
        //     this.lastTransactions = values[0];
        //     this.totalAmountPerMonth = this.mapToUiOutcome(values[1]);
        // });
        this.refreshInterval = setInterval(() => this.refreshData(), DashboardComponent.REFRESH_INTERVAL);
    }

    ngOnDestroy(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = undefined;
        }
    }

    @HostListener('window:focus')
    public onWindowFocus() {
        if (this.dataOld) {
            this.refreshData();
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
        if (document.hidden) {
            this.dataOld = true;
            return;
        }
        this.dataOld = false;
        Rx.zip(this.coinageData.getRecentTransactions(), this.coinageData.getTotalOutcomesPerMonth(), this.coinageData.getBalanceForActiveAccounts())
            .pipe(
                finalize(() => {
                    this.showPage = true;
                })
            )
            .subscribe(([transactions, outcomes, balance]) => {
                this.lastTransactions = transactions;
                this.totalAmountPerMonth = this.mapToUiOutcome(outcomes);
                this.balanceMainAccount = balance[0].balance;
                this.balanceSecondary = balance[1].balance;
                this.accountStatsChartData[0].data = this.totalAmountPerMonth.map((item) => item.outcomes).reverse();
                this.accountStatsChartData[1].data = this.totalAmountPerMonth.map((item) => item.incomes).reverse();
                this.accountStatsChartLabels = this.totalAmountPerMonth.map((item) => `${item.monthName} ${item.year}`).reverse();
            });
        if (this.countersComponent) {
            this.countersComponent.refreshData();
        }
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

    get totalChange() {
        return this.totalAmountPerMonth.reduce((a, t) => a + t.incomes - t.outcomes, 0);
    }

    public createInternalTransfer(desc: string, amount: number, date: string, id1: number, id2: number) {
        this.coinageData
            .postCreateInternalTransfer(
                {
                    description: desc,
                    amount: amount,
                    date: date,
                },
                id1,
                id2
            )
            .subscribe();
    }
}
