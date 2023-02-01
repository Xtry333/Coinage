import * as Rx from 'rxjs';

import { ChartDataset } from 'chart.js';
import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MonthlyUserStatsDTO, NewMonthlyUserStatsDTO, PartialDate, TransferDTO } from '@coinage-app/interfaces';

import { CoinageDataService } from '../services/coinage.data-service';
import { DashboardCountersComponent } from './dashboard-counters/dashboard-counters.component';
import { DateParserService } from '../services/date-parser.service';
import { NavigatorPages } from '../services/navigator.service';
import { finalize } from 'rxjs/operators';

interface UiTotalAmountPerMonth {
    date: string;
    year: number;
    monthName: string;
    partedDate: PartialDate;
    incomes: number;
    outcomes: number;
    balance: number;
    profit: number;
    transactionsCount: number;
    profitPerDay: number;
}

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
    public static readonly REFRESH_INTERVAL = 10000;

    public NavigatorPages = NavigatorPages;

    public accountStatsChartData: ChartDataset[] = [
        { data: [], label: 'Outcomes', type: 'bar', stack: 'change', barPercentage: 0.33, inflateAmount: 0.33 },
        { data: [], label: 'Incomes', type: 'bar', stack: 'change', barPercentage: 0.33, inflateAmount: 0.33 },
        { data: [], label: 'Balance', type: 'line', order: -1 },
    ];

    public accountStatsChartLabels: string[] = [];

    // public accountStatsChartOptions: ChartOptions = {
    //     responsive: true,
    //     onClick: (event, activeElements) => console.log(activeElements[0]?.datasetIndex, activeElements[0]?.index),
    //     elements: {
    //         line: {
    //             tension: 0.3,
    //         },
    //     },
    //     plugins: {
    //         // zoom: {
    //         //     pan: {
    //         //         enabled: true,
    //         //         mode: 'xy',
    //         //     },
    //         //     zoom: {
    //         //         wheel: {
    //         //             enabled: true,
    //         //         },
    //         //         overScaleMode: 'y',
    //         //     },
    //         //     limits: {
    //         //         x: { min: 0, max: 2, minRange: 50 },
    //         //         y: { min: 0, max: 50000, minRange: 50 },
    //         //     },
    //         // },
    //     },
    // };

    public message = '';
    public transactionId = 0;
    public lastTransactions: TransferDTO[] = [];
    public totalAmountPerMonth: UiTotalAmountPerMonth[] = [];
    public showPage = false;
    public refreshInterval?: ReturnType<typeof setInterval>;
    public averageAmountLimit = 5;
    public balanceMainAccount = 0;
    public balanceSecondary = 0;
    public dataOld = false;

    @ViewChild(DashboardCountersComponent)
    public countersComponent!: DashboardCountersComponent;

    public constructor(private readonly coinageData: CoinageDataService, private readonly partedDateService: DateParserService) {}

    public ngOnInit(): void {
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

        console.log('tests');
        console.log(new Date());
        console.log(PartialDate.fromDate(new Date()));
    }

    public ngOnDestroy(): void {
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
        Rx.zip(this.coinageData.getRecentTransactions(), this.coinageData.getAccountMonthlyStats(), this.coinageData.getBalanceForActiveAccounts(new Date()))
            .pipe(
                finalize(() => {
                    this.showPage = true;
                })
            )
            .subscribe(([recentlyEditedTransfers, stats, balance]) => {
                this.lastTransactions = recentlyEditedTransfers;
                this.totalAmountPerMonth = this.mapToUiOutcome(stats);
                const accountData = this.mapAccountData(stats);
                // this.balanceMainAccount = balance[0].balance;
                // this.balanceSecondary = balance[1].balance;

                // this.accountStatsChartData.splice(0, this.accountStatsChartData.length);
                // this.accountStatsChartData = [
                //     { data: [], label: 'Outcomes', type: 'bar', stack: 'change', barPercentage: 0.33, inflateAmount: 0.33 },
                //     { data: [], label: 'Incomes', type: 'bar', stack: 'change', barPercentage: 0.33, inflateAmount: 0.33 },
                //     { data: [], label: 'Balance', type: 'line', order: -1 },
                // ];
                this.accountStatsChartData[0].data = this.totalAmountPerMonth.map((item) => item.outcomes).reverse();
                this.accountStatsChartData[1].data = this.totalAmountPerMonth.map((item) => item.incomes).reverse();
                this.accountStatsChartData[2].data = this.totalAmountPerMonth.map((item) => item.balance).reverse();
                this.accountStatsChartLabels = this.totalAmountPerMonth.map((item) => `${item.monthName} ${item.year}`).reverse();

                //accountData.forEach((a) => this.accountStatsChartData.push(a));
            });
        if (this.countersComponent) {
            this.countersComponent.refreshData();
        }
    }

    private mapToUiOutcome(totalOutcomes: NewMonthlyUserStatsDTO[]): UiTotalAmountPerMonth[] {
        return totalOutcomes.map((total) => {
            const profit = total.totalIncoming - total.totalOutgoing;
            const uiData: UiTotalAmountPerMonth = {
                year: total.year,
                date: total.year + '-' + total.month,
                monthName: new Date(total.year, total.month - 1).toLocaleString(undefined, { month: 'long' }),
                partedDate: new PartialDate(total.year, total.month),
                outcomes: total.externalOutgoing,
                incomes: total.externalIncoming,
                balance: total.balance,
                profit: profit,
                transactionsCount: 0,
                profitPerDay: -profit / this.daysInMonth(total.year, total.month),
            };

            return uiData;
        });
    }

    private mapAccountData(totalOutcomes: NewMonthlyUserStatsDTO[]) {
        const accountsData: { data: number[]; label: any }[] = [];
        totalOutcomes.forEach((monthly) => {
            monthly.accountStats.forEach((acc) => {
                accountsData[acc.accountId] ??= { data: [], label: acc.accountId };
                accountsData[acc.accountId].data.push(acc.balance);
            });
        });
        return accountsData;
    }

    private daysInMonth(year: number, month: number): number {
        const today = new Date();
        if (today.getFullYear() == year && today.getMonth() + 1 == month) {
            return today.getDate();
        }
        const date = new Date(year, month, 0);
        return date.getDate();
    }

    public formatDate(date: string): string {
        return this.partedDateService.formatDate(new Date(date));
    }

    public get rollingAverageIncomes() {
        return this.totalAmountPerMonth.slice(0, this.averageAmountLimit).reduce((a, i) => a + i.incomes, 0) / this.averageAmountLimit;
    }

    public get rollingAverageOutcomes() {
        return this.totalAmountPerMonth.slice(0, this.averageAmountLimit).reduce((a, i) => a + i.outcomes, 0) / this.averageAmountLimit;
    }

    public get totalChange() {
        return this.totalAmountPerMonth.reduce((a, t) => a + t.incomes - t.outcomes, 0);
    }

    public createInternalTransfer(desc: string, amount: number, date: Date, id1: number, id2: number) {
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
