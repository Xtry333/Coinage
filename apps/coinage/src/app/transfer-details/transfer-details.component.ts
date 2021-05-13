import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TransferDetailsDTO, TransferDTO } from '@coinage-app/interfaces';
import { RestApiService } from '../restapi.service';

@Component({
    selector: 'coinage-app-transfer-details',
    templateUrl: './transfer-details.component.html',
    styleUrls: ['./transfer-details.component.less'],
})
export class TransferDetailsComponent implements OnInit {
    transfer: TransferDetailsDTO;
    transactionId: number = 0;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly restApi: RestApiService
    ) {
        // this.restApi
        //     .getTransactionsObserver()
        //     .subscribe(
        //         (transactions) => (this.lastTransactions = transactions)
        //     );
    }

    ngOnInit(): void {
        this.loadData();
    }

    private loadData(): void {
        this.route.paramMap.subscribe((params) => {
            const id = parseInt(params.get('id'));
            if (id) {
                this.restApi.getTransferDetails(id).then((transfer) => {
                    this.transfer = transfer;
                    console.log(transfer);
                });
            } else {
                //this.route.
            }
        });
    }
}
