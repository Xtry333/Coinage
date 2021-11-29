import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReceiptDetailsDTO, TransferType } from '@coinage-app/interfaces';
import { CoinageDataService } from '../services/coinageData.service';
import * as Rx from 'rxjs';
import { NavigatorService } from '../services/navigator-service.service';

@Component({
    selector: 'coinage-app-receipt-details',
    templateUrl: './receipt-details.component.html',
    styleUrls: ['./receipt-details.component.scss'],
})
export class ReceiptDetailsComponent implements OnInit {
    showPage = false;

    receiptDetails!: ReceiptDetailsDTO;

    constructor(private readonly route: ActivatedRoute, private readonly navigator: NavigatorService, private readonly coinageData: CoinageDataService) {}

    ngOnInit(): void {
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

    get receiptDirectionDisplaySymbol(): string {
        return TransferType.OUTCOME.symbol;
    }
}
