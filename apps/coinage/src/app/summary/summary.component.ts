import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TransferDTO } from '@coinage-app/interfaces';

import { CoinageDataService } from '../services/coinageData.service';
import { DateParserService, PartedDate } from '../services/date-parser.service';

export interface UiTotalInMonthByCategory {
    categoryName: string;
    amount: number;
    summedAmount?: number;
    numberOfTransfers: number;
}

@Component({
    selector: 'coinage-app-summary',
    templateUrl: './summary.component.html',
    styleUrls: ['./summary.component.scss'],
})
export class SummaryComponent implements OnInit {
    showPage = false;
    partedDate!: PartedDate;
    datetime!: Date;
    datePartsArray!: string[];
    selectedDate!: string;
    outcomesPerCategory: UiTotalInMonthByCategory[] = [];
    transfers: TransferDTO[] = [];

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly coinageData: CoinageDataService,
        private readonly partedDateService: DateParserService
    ) {}

    ngOnInit(): void {
        this.showPage = false;
        this.route.paramMap.subscribe((params) => {
            this.showPage = false;
            this.datePartsArray = params.get('partialDate')?.split('-') ?? [];
            const partialDate = this.datePartsArray.map((p) => parseInt(p));
            this.partedDate = { year: partialDate[0], month: partialDate[1], day: partialDate[2] };
            this.datetime = this.partedDateService.toDate(this.partedDate);
            this.selectedDate = this.partedDateService.toDate(this.partedDate).toISOString().slice(0, 10);
            if (this.partedDate.month) {
                this.coinageData.getTotalPerCategory(this.partedDate.year, this.partedDate.month, this.partedDate.day).subscribe((response) => {
                    this.outcomesPerCategory = response.map((o) => {
                        return {
                            categoryName: o.categoryName,
                            amount: parseFloat(o.amount),
                            summedAmount: response
                                .filter((r) => o.categoryId === r.categoryParentId)
                                .reduce((a, b) => a + parseFloat(b.amount), parseFloat(o.amount)),
                            numberOfTransfers: o.numberOfTransfers,
                        };
                    });
                    this.showPage = true;
                });
            } else {
                this.showPage = true;
            }
            if (this.isDateTargetDay) {
                this.coinageData
                    .getAllTransfers({
                        page: 1,
                        rowsPerPage: 1000,
                        date: { from: this.datetime.toISOString().slice(0, 10), to: this.datetime.toISOString().slice(0, 10) },
                    })
                    .subscribe((response) => {
                        this.transfers = response.transfers.filter((t) => t.date === this.selectedDate);
                    });
            } else if (this.isDateTargetMonth) {
                this.coinageData
                    .getAllTransfers({ page: 1, rowsPerPage: 500, date: { from: this.monthStartDate.toISOString(), to: this.monthEndDate.toISOString() } })
                    .subscribe((response) => {
                        this.transfers = response.transfers.filter(
                            (t) => new Date(t.date).getMonth() + 1 === this.partedDate.month && new Date(t.date).getFullYear() === this.partedDate.year
                        );
                    });
            }
        });
    }

    get isDateTargetDay(): boolean {
        return this.partedDateService.isDateTargetDay(this.partedDate);
    }

    get isDateTargetMonth(): boolean {
        return this.partedDateService.isDateTargetMonth(this.partedDate);
    }

    // create a new date with the same month and year as the current date and first day of the month
    get monthStartDate(): Date {
        const date = new Date(this.datetime);
        date.setDate(1);
        return date;
    }

    // create a new date with the same month and year as the current date and last day of the month
    get monthEndDate(): Date {
        const date = new Date(this.datetime);
        date.setDate(1);
        date.setMonth(date.getMonth() + 1);
        date.setDate(0);
        return date;
    }

    getParentPartedDate(): PartedDate {
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

    get tableHeader(): string {
        return 'Transfers in ' + this.partedDateService.joinPartedDate(this.partedDate);
    }

    onDateChange() {
        console.log(this.selectedDate);
        const parted = this.partedDateService.toPartedDate(this.selectedDate);
        const target = this.partedDateService.joinPartedDate(parted);
        this.router.navigate(['summary', target]);
    }

    goUp() {
        this.router.navigate(['summary', this.partedDateService.joinPartedDate(this.getParentPartedDate())]);
    }

    shouldShowGoUpButton(): boolean {
        return !!this.partedDate.month;
    }
}
