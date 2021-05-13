import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TransferDetailsDTO } from '@coinage-app/interfaces';
import { CoinageDataService } from '../coinageData.service';

@Component({
    selector: 'coinage-app-transfer-details',
    templateUrl: './transfer-details.component.html',
    styleUrls: ['./transfer-details.component.less'],
})
export class TransferDetailsComponent implements OnInit {
    showPage = false;
    transfer: TransferDetailsDTO;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly coinageData: CoinageDataService
    ) {
        // this.restApi
        //     .getTransactionsObserver()
        //     .subscribe(
        //         (transactions) => (this.lastTransactions = transactions)
        //     );
    }

    ngOnInit(): void {
        this.showPage = false;
        this.route.paramMap.subscribe((params) => {
            const id = parseInt(params.get('id'));
            if (id) {
                this.coinageData.getTransferDetails(id).then((transfer) => {
                    this.transfer = transfer;
                    this.showPage = true;
                });
            } else {
                //this.route.
            }
        });
    }
}
