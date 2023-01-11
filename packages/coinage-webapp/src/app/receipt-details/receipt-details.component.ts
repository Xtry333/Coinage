import * as Rx from 'rxjs';

import { Component, OnInit } from '@angular/core';
import { ReceiptDetailsDTO, TransferType } from '@coinage-app/interfaces';

import { ActivatedRoute } from '@angular/router';
import { CoinageDataService } from '../services/coinage.data-service';
import { NavigatorService } from '../services/navigator.service';

@Component({
    selector: 'app-receipt-details',
    templateUrl: './receipt-details.component.html',
    styleUrls: ['./receipt-details.component.scss'],
})
export class ReceiptDetailsComponent implements OnInit {
    public showPage = false;

    public receiptDetails!: ReceiptDetailsDTO;

    public constructor(
        private readonly route: ActivatedRoute,
        private readonly navigator: NavigatorService,
        private readonly coinageData: CoinageDataService
    ) {}

    public ngOnInit(): void {
        this.showPage = false;
        this.route.paramMap.subscribe((params) => {
            const id = parseInt(params.get('id') ?? '') ?? undefined;
            if (id) {
                Rx.zip(this.coinageData.getReceiptDetails(id)).subscribe(([receipt]) => {
                    this.receiptDetails = receipt;
                    this.showPage = true;
                });
            } else {
                this.navigator.goToNotFoundPage();
            }
        });
    }

    public get receiptDirectionDisplaySymbol(): string {
        return TransferType.OUTCOME.symbol;
    }

    public get remainingAmount(): number {
        return Math.abs(this.receiptDetails.totalTransferred - (this.receiptDetails.amount ?? 0));
    }
}
