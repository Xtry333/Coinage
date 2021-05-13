import { Component, OnInit } from '@angular/core';
import { TransferDTO } from '@coinage-app/interfaces';
import { CoinageDataService } from '../coinageData.service';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'coinage-app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.less'],
})
export class DashboardComponent implements OnInit {
    message: string = '';
    transactionId: number = 0;
    lastTransactions: TransferDTO[];
    showPage = false;

    constructor(private readonly coinageData: CoinageDataService) {}

    ngOnInit(): void {
        this.showPage = false;
        this.coinageData
            .getTransactionsObserver()
            .pipe(
                finalize(() => {
                    this.showPage = true;
                })
            )
            .subscribe(
                (transactions) => (this.lastTransactions = transactions)
            );
    }

    // private loadData(): void {
    //     this.route.paramMap.subscribe((params) => {
    //         const id = parseInt(params.get('id'));
    //         this.restApi.getTransfer(id).then((transfer) => {
    //             this.message = transfer.description;
    //         });
    //     });
    // }
}
