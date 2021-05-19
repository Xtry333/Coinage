import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CoinageDataService } from '../services/coinageData.service';
import { DateParserService, PartedDate } from '../services/date-parser.service';

@Component({
    selector: 'coinage-app-summary',
    templateUrl: './summary.component.html',
    styleUrls: ['./summary.component.less'],
})
export class SummaryComponent implements OnInit {
    showPage = false;
    partedDate: PartedDate;
    datetime: Date;
    datePartsArray: string[];

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly coinageData: CoinageDataService,
        private readonly partedDateService: DateParserService
    ) {}

    ngOnInit(): void {
        this.showPage = false;
        this.route.paramMap.subscribe((params) => {
            this.datePartsArray = params.get('partialDate').split('-');
            const partialDate = this.datePartsArray.map((p) => parseInt(p));
            this.partedDate = { year: partialDate[0], month: partialDate[1], day: partialDate[2] };
            this.datetime = this.partedDateService.getDateFromParted(this.partedDate);
            console.log(this.partedDate);
            console.log(this.datetime);
            this.showPage = true;
        });
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

    goUp() {
        this.router.navigate(['summary', this.partedDateService.joinPartedDate(this.getParentPartedDate())]);
    }

    shouldShowGoUpButton(): boolean {
        return !!this.partedDate.month;
    }
}
