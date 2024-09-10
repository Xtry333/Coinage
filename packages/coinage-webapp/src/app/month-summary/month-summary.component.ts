import { ActivatedRoute, Router } from '@angular/router';
import { BalanceDTO, TransferDTO, TransferTypeEnum } from '@coinage-app/interfaces';
import { ChartDataset, ChartOptions } from 'chart.js';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { DateParserService, PartedDate } from '../services/date-parser.service';
import { Subscription, lastValueFrom } from 'rxjs';

import { CoinageDataService } from '../services/coinage.data-service';
import { TableFilterFields } from '../transfers-table/transfers-table.component';

export interface UiTotalInMonthByCategory {
    categoryName: string;
    amount: number;
    summedAmount?: number;
    numberOfTransfers: number;
}

@Component({
    selector: 'app-summary',
    templateUrl: './month-summary.component.html',
    styleUrls: ['./month-summary.component.scss'],
})
export class MonthSummaryComponent implements OnInit, OnDestroy {
    public showPage = false;
    public partedDate!: PartedDate;
    public datetime!: Date;
    public datePartsArray!: string[];
    public selectedDate!: string;
    public selectedMonth!: string;
    public outcomesPerCategory: UiTotalInMonthByCategory[] = [];
    public transfers: TransferDTO[] = [];
    public tableFilterParams: TableFilterFields = {};

    public routeSubscription?: Subscription;

    public summaryChartData: ChartDataset[] = [];
    public summaryChartLabels: string[] = [];
    public summaryChartOptions: ChartOptions = {
        animation: false,
    };

    public constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly coinageData: CoinageDataService,
        private readonly partedDateService: DateParserService,
    ) {
        console.log(this);
    }

    public ngOnInit(): void {
        this.routeSubscription = this.route.paramMap.subscribe((params) => {
            // this.showPage = false;
            this.selectedMonth = params.get('month') ?? '';
            const selectedMonthParts = this.selectedMonth.split('-');
            const year = parseInt(selectedMonthParts[0]);
            const month = parseInt(selectedMonthParts[1]);

            this.datePartsArray = params.get('month')?.split('-') ?? [];
            const partialDate = this.datePartsArray.map((p) => parseInt(p));
            this.partedDate = { year: partialDate[0], month: partialDate[1], day: partialDate[2] };
            this.datetime = this.partedDateService.toDate(this.partedDate);
            this.selectedDate = this.partedDateService.toDate(this.partedDate).toISOString().slice(0, 10);
            if (this.partedDate.month) {
                this.coinageData.getTotalPerCategory(this.partedDate.year, this.partedDate.month, this.partedDate.day).subscribe((response) => {
                    this.outcomesPerCategory = response
                        .map((o) => {
                            return {
                                categoryName: o.categoryName,
                                amount: parseFloat(o.amount),
                                summedAmount: response
                                    .filter((r) => o.categoryId === r.categoryParentId)
                                    .reduce((a, b) => a + parseFloat(b.amount), parseFloat(o.amount)),
                                numberOfTransfers: o.numberOfTransfers,
                            };
                        })
                        .sort((a, b) => a.categoryName.localeCompare(b.categoryName));
                    this.showPage = true;
                });
            } else {
                this.showPage = true;
            }
            this.loadData();
        });
    }

    public ngOnDestroy(): void {
        if (this.routeSubscription !== undefined) {
            this.routeSubscription.unsubscribe();
        }
    }

    private loadData(): void {
        const requestedDateBalance = new Date(this.selectedMonth);
        requestedDateBalance.setDate(0);
        console.log(requestedDateBalance);
        if (this.isDateTargetMonth) {
            Promise.all([
                this.coinageData.getAllFilteredTransfers({
                    page: 1,
                    rowsPerPage: 500,
                    ...this.tableFilterParams,
                    date: { from: this.monthStartDate, to: this.monthEndDate },
                    userId: 1,
                    showPlanned: true,
                }),
                lastValueFrom(this.coinageData.getBalanceForActiveAccounts(requestedDateBalance)),
            ])
                .then(([allFilteredTransfers, balance]) => {
                    this.transfers = allFilteredTransfers.transfers.filter(
                        (t) => new Date(t.date).getMonth() + 1 === this.partedDate.month && new Date(t.date).getFullYear() === this.partedDate.year,
                    );
                    this.initializeChartLabels();
                    this.populateChartDataset(balance);
                })
                .catch((e) => console.error(e));
        }
    }

    private initializeChartLabels(): void {
        this.summaryChartLabels = [];
        for (let i = 0; i <= this.getThisMonthsLastDay(); i++) {
            this.summaryChartLabels.push(`${i}`);
        }
    }

    private populateChartDataset(initialBalances: BalanceDTO[]): void {
        console.log(initialBalances);
        console.log(this.tableFilterParams);
        const dailyChange: number[] = new Array(this.summaryChartLabels.length).fill(0);
        const incrementalSum: number[] = new Array(this.summaryChartLabels.length).fill(0);
        const incrementalSumHidden = !!(
            this.tableFilterParams.description ||
            (this.tableFilterParams.categoryIds?.length ?? 0) ||
            (this.tableFilterParams.contractorIds?.length ?? 0) > 0
        );

        for (let i = 0; i < this.transfers.length; i++) {
            const transfer = this.transfers[i];
            const day = transfer.date.getDate();
            if (transfer.type === TransferTypeEnum.OUTCOME) {
                dailyChange[day] -= transfer.amount;
            } else {
                dailyChange[day] += transfer.amount;
            }
        }

        let sum = initialBalances
            .filter(
                (acc) =>
                    this.tableFilterParams.accountIds === undefined ||
                    this.tableFilterParams.accountIds.length === 0 ||
                    this.tableFilterParams.accountIds.includes(acc.accountId),
            )
            .reduce((a, b) => a + b.balance, 0);
        for (let i = 0; i < dailyChange.length; i++) {
            const amount = dailyChange[i];
            if (typeof amount === 'number') {
                sum += amount;
                incrementalSum[i] = sum;
            }
        }
        this.summaryChartData = [
            { data: dailyChange, label: 'Daily Change', type: 'bar', barPercentage: 0.5, order: 1, inflateAmount: 0.33 },
            { data: incrementalSum, label: 'Total Balance', tension: 0.3, hidden: incrementalSumHidden },
        ];
        console.log(this);
    }

    public get isDateTargetDay(): boolean {
        return this.partedDateService.isDateTargetDay(this.partedDate);
    }

    public get isDateTargetMonth(): boolean {
        return this.partedDateService.isDateTargetMonth(this.partedDate);
    }

    public get monthStartDate(): Date {
        const date = new Date(this.datetime);
        date.setUTCDate(1);
        return date;
    }

    public get monthEndDate(): Date {
        const date = new Date(this.selectedMonth);
        // date.setUTCDate(1);
        date.setUTCMonth(date.getUTCMonth() + 1);
        date.setUTCDate(0);
        return date;
    }

    public onTableFilter(filterParams: TableFilterFields): void {
        this.tableFilterParams = filterParams;
        this.loadData();
    }

    public get monthName(): string {
        const monthName = this.datetime.toLocaleString(undefined, { month: 'long' });
        return monthName.charAt(0).toUpperCase() + monthName.slice(1);
    }

    public getParentPartedDate(): PartedDate {
        const date = { ...this.partedDate };

        if (date.month && date.day) {
            date.day = undefined;
        } else if (!date.day) {
            date.month = undefined;
        }
        return date;
    }

    public formatDate(date: string): string {
        return this.partedDateService.formatDate(new Date(date));
    }

    public transferIdTracker(index: number, item: TransferDTO): string {
        return item.id.toString();
    }

    public get tableHeader(): string {
        return 'Transfers in ' + this.partedDateService.joinPartedDate(this.partedDate);
    }

    public onDateChange() {
        console.log(this.selectedDate);
        const parted = this.partedDateService.toPartedDate(this.selectedDate);
        const target = this.partedDateService.joinPartedDate(parted);
        this.router.navigate(['summary', target]);
    }

    public onMonthChange() {
        console.log(this.selectedMonth);
        this.router.navigate(['summary', this.selectedMonth]);
    }

    public goUp() {
        this.router.navigate(['summary', this.partedDateService.joinPartedDate(this.getParentPartedDate())]);
    }

    public shouldShowGoUpButton(): boolean {
        return !!this.partedDate.month;
    }

    private getThisMonthsLastDay(): number {
        const date = new Date(this.datetime);
        date.setMonth(date.getMonth() + 1);
        date.setDate(0);
        return date.getDate();
    }
}
