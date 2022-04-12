import * as Rx from 'rxjs';

import { Component, OnDestroy, OnInit } from '@angular/core';
import { GetFilteredTransfersRequest, Range, TransferDTO } from '@coinage-app/interfaces';

import { ActivatedRoute } from '@angular/router';
import { CoinageDataService } from '../services/coinage.data-service';
import { CoinageLocalStorageService } from '../services/coinage-local-storage.service';
import { TableFilterFields } from '../transfers-table/transfers-table.component';
import { finalize } from 'rxjs/operators';

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

    public readonly TRANSFERS_FILTER_CACHE_PATH = 'transfers.list.filters';

    showPage = false;

    refreshInterval?: ReturnType<typeof setInterval>;

    transfers: TransferDTO[] = [];
    totalCount = 0;

    filterParams: GetFilteredTransfersRequest = {
        page: 1,
        rowsPerPage: 100,
    };

    constructor(private route: ActivatedRoute, private readonly coinageData: CoinageDataService, private readonly localStorage: CoinageLocalStorageService) {}

    ngOnInit(): void {
        this.showPage = false;
        this.route.queryParams.subscribe((params) => {
            const { page, rowsPerPage } = params as TransfersListQueryParams;
            this.filterParams.page = Number(page ?? this.filterParams.page);
            this.filterParams.rowsPerPage = Number(rowsPerPage ?? this.filterParams.rowsPerPage);

            const cachedFilters = this.localStorage.getObject<TableFilterFields>(this.TRANSFERS_FILTER_CACHE_PATH);
            if (cachedFilters) {
                this.onPerformFilter(cachedFilters);
            } else {
                this.refreshData();
            }

            window.scroll({
                top: 0,
                left: 0,
                behavior: 'smooth',
            });
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
        this.coinageData
            .getAllFilteredTransfers(this.filterParams)
            .then((response) => {
                this.transfers = response.transfers;
                this.totalCount = response.totalCount;
            })
            .finally(() => {
                this.showPage = true;
            });
    }

    public onPerformFilter(filterParams: TableFilterFields): void {
        this.filterParams = {
            ...this.filterParams,
            ...filterParams,
            amount: this.mapRangeFilterParams(filterParams),
        };
        this.refreshData();
    }

    public onEndOfPage(): void {
        console.log('onEndOfPage');
    }

    get lastPageNumber(): number {
        return Math.ceil(this.totalCount / this.filterParams.rowsPerPage);
    }

    private mapRangeFilterParams(filterParams: TableFilterFields): Range<number> | undefined {
        if (filterParams.amountFrom !== undefined && filterParams.amountTo !== undefined) {
            return {
                from: filterParams.amountFrom,
                to: filterParams.amountTo,
            };
        }

        return undefined;
    }
}
