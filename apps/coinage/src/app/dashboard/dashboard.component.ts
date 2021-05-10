import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TransferDTO } from '@coinage-app/interfaces';
import { RestApiService } from '../restapi.service';

@Component({
    selector: 'coinage-app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.less'],
})
export class DashboardComponent implements OnInit {
    message: string = '';
    transactionId: number = 0;
    transactionList: TransferDTO[] = [];

    constructor(
        private readonly route: ActivatedRoute,
        private readonly restApi: RestApiService
    ) {
        this.restApi
            .getTransactionsObserver()
            .subscribe((transactions) => (this.transactionList = transactions));
    }

    ngOnInit(): void {
        // this.loadData();
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
