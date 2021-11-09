import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryDTO, SplitTransferDTO, TransferDetailsDTO, TransferType, TransferTypeEnum } from '@coinage-app/interfaces';
import { CoinageDataService } from '../services/coinageData.service';
import * as Rx from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'coinage-app-transfer-details',
    templateUrl: './transfer-details.component.html',
    styleUrls: ['./transfer-details.component.scss'],
})
export class TransferDetailsComponent implements OnInit {
    showPage = false;
    transfer!: TransferDetailsDTO;

    @Input()
    splitTransfer: SplitTransferDTO = { id: 0, description: '', amount: 0, categoryId: 0 };
    totalPayment = 0;
    shouldShowSplit = false;

    categories: CategoryDTO[] = [];

    constructor(private readonly route: ActivatedRoute, private readonly router: Router, private readonly coinageData: CoinageDataService) {}

    ngOnInit(): void {
        this.showPage = false;
        this.route.paramMap.subscribe((params) => {
            const id = parseInt(params.get('id') ?? '');
            if (id) {
                Rx.zip(this.coinageData.getTransferDetails(id), this.coinageData.getCategoryList())
                    .pipe(
                        finalize(() => {
                            this.showPage = true;
                        })
                    )
                    .subscribe(([transfer, categories]) => {
                        console.log(transfer);
                        this.transfer = transfer;
                        this.totalPayment = transfer.amount + transfer.otherTransfers.reduce((a, t) => a + t.amount, 0);
                        this.categories = categories;
                        this.splitTransfer.amount = +(transfer.amount / 2).toFixed(2);
                        this.splitTransfer.categoryId = transfer.categoryPath[transfer.categoryPath.length - 1].id;
                        this.splitTransfer.description = transfer.description;
                        console.log(this.transfer.otherTransfers);
                    });
            } else {
                this.router.navigateByUrl('notFound');
            }
        });
    }

    public onToggleShowSplit(): void {
        this.shouldShowSplit = !this.shouldShowSplit;
    }

    public onClickSplitTransfer(): void {
        if (this.transfer)
            this.coinageData
                .postSplitTransaction({
                    id: this.transfer.id,
                    description: this.splitTransfer.description,
                    amount: parseFloat(this.splitTransfer.amount?.toString()) ?? null,
                    categoryId: this.splitTransfer.categoryId,
                })
                .subscribe((result) => {
                    this.shouldShowSplit = false;
                    this.router.navigateByUrl(`/details/${result.insertedId}`);
                });
    }

    public onClickEditMode(): void {
        if (this.transfer) this.router.navigateByUrl(`/transfer/edit/${this.transfer.id}`);
    }

    get transferTypeDisplayName(): string {
        return TransferType[this.transfer.type].displayName;
    }

    get transferTypeDisplaySymbol(): string {
        return TransferType[this.transfer.type].symbol;
    }

    get isOutcome(): boolean {
        return this.transfer.type === TransferTypeEnum.OUTCOME;
    }
}
