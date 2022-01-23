import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GetFilteredTransfersRequest, TransferDTO } from '@coinage-app/interfaces';
import * as Rx from 'rxjs';
import { finalize } from 'rxjs/operators';

import { CoinageDataService } from '../services/coinageData.service';

interface TransfersListQueryParams {
    page: number;
    rowsPerPage: number;
}

@Component({
    selector: 'coinage-app-transfers-list',
    templateUrl: './transfers-list.component.html',
    styleUrls: ['./transfers-list.component.scss'],
})
export class TransfersListComponent implements OnInit, OnDestroy {
    public static REFRESH_INTERVAL = 10000;
    showPage = false;

    refreshInterval?: ReturnType<typeof setInterval>;

    transfers: TransferDTO[] = [];
    totalCount = 0;

    filterParams: GetFilteredTransfersRequest = {
        page: 1,
        rowsPerPage: 100,
    };

    constructor(private route: ActivatedRoute, private readonly coinageData: CoinageDataService) {}

    ngOnInit(): void {
        this.showPage = false;
        this.route.queryParams.subscribe((params) => {
            const { page, rowsPerPage } = params as TransfersListQueryParams;
            this.filterParams.page = page ?? this.filterParams.page;
            this.filterParams.rowsPerPage = rowsPerPage ?? this.filterParams.rowsPerPage;
            this.refreshData();
        });

        this.refreshInterval = setInterval(() => this.refreshData(), TransfersListComponent.REFRESH_INTERVAL);
    }

    ngOnDestroy(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = undefined;
        }
    }

    public refreshData() {
        Rx.zip(this.coinageData.getAllTransfers(this.filterParams))
            .pipe(
                finalize(() => {
                    this.showPage = true;
                })
            )
            .subscribe(([response]) => {
                this.transfers = response.transfers;
                this.totalCount = response.totalCount;
            });
    }

    get lastPageNumber(): number {
        return Math.ceil(this.totalCount / this.filterParams.rowsPerPage);
    }
}
