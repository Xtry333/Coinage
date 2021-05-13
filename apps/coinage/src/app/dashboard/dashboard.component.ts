import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TransferDTO } from '@coinage-app/interfaces';
import { Observable } from 'rxjs';
import { RestApiService } from '../restapi.service';
import { of } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { map, finalize } from 'rxjs/operators';

@Component({
    selector: 'coinage-app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.less'],
})
export class DashboardComponent implements OnInit {
    message: string = '';
    transactionId: number = 0;
    lastTransactions: TransferDTO[];
    loading = false;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly restApi: RestApiService
    ) {}

    ngOnInit(): void {
        this.loading = true;
        this.restApi
            .getTransactionsObserver()
            .pipe(
                finalize(() => {
                    this.loading = false;
                    console.log(this.lastTransactions);
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
