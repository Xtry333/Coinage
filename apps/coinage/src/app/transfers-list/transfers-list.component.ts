import { Component, OnDestroy, OnInit } from '@angular/core';
import { TransferDTO } from '@coinage-app/interfaces';
import { CoinageDataService } from '../services/coinageData.service';
import * as Rx from 'rxjs';
import { finalize } from 'rxjs/operators';

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

    constructor(private readonly coinageData: CoinageDataService) {}

    ngOnInit(): void {
        this.showPage = false;
        Rx.zip(this.coinageData.getAllTransfers())
            .pipe(
                finalize(() => {
                    this.showPage = true;
                })
            )
            .subscribe((values) => {
                this.transfers = values[0];
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
        Rx.zip(this.coinageData.getAllTransfers(), this.coinageData.getTotalOutcomesPerMonth()).subscribe(([transfers]) => {
            this.transfers = transfers;
        });
    }
}
