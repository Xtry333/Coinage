import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryDTO, SplitTransferDTO, TransferDetailsDTO, TransferType, TransferTypeEnum } from '@coinage-app/interfaces';
import { CoinageDataService } from '../services/coinageData.service';
import * as Rx from 'rxjs';
import { finalize, catchError } from 'rxjs/operators';
import { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { faClock, faReceipt, faReply } from '@fortawesome/free-solid-svg-icons';
import { NotificationService } from '../services/notification.service';
import { NavigatorPages, NavigatorService } from '../services/navigator.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'coinage-app-transfer-details',
    templateUrl: './transfer-details.component.html',
    styleUrls: ['./transfer-details.component.scss'],
})
export class TransferDetailsComponent implements OnInit {
    plannedIcon: IconDefinition = faClock;
    receiptIcon: IconDefinition = faReceipt;
    refundedIcon: IconDefinition = faReply;
    showPage = false;
    transfer!: TransferDetailsDTO;

    public NavigatorPages = NavigatorPages;

    @Input()
    splitTransfer: SplitTransferDTO = { id: 0, description: '', amount: 0, categoryId: 0 };
    totalPayment = 0;
    shouldShowSplit = false;

    categories: CategoryDTO[] = [];

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly navigator: NavigatorService,
        private readonly coinageData: CoinageDataService,
        private readonly notificationService: NotificationService
    ) {}

    ngOnInit(): void {
        this.showPage = false;
        this.route.paramMap.toPromise();
        this.route.paramMap.subscribe((params) => {
            const id = parseInt(params.get('id') ?? '');
            if (id) {
                Rx.zip(this.coinageData.getTransferDetails(id), this.coinageData.getCategoryList())
                    .pipe(
                        catchError(() => {
                            this.notificationService.push({
                                title: 'Error',
                                message: 'Transfer not found',
                            });
                            this.navigator.goTo(NavigatorPages.Dashboard());
                            throw 404;
                        }),
                        finalize(() => {
                            this.showPage = true;
                        })
                    )
                    .subscribe(([transfer, categories]: [TransferDetailsDTO, CategoryDTO[]]) => {
                        console.log(transfer);
                        this.transfer = transfer;
                        this.totalPayment =
                            transfer.amount * TransferType[transfer.type].mathSymbol +
                            transfer.otherTransfers.reduce((a, t) => a + t.amount * TransferType[t.type].mathSymbol, 0);
                        this.categories = categories;
                        this.splitTransfer.amount = +(transfer.amount / 2).toFixed(2);
                        this.splitTransfer.categoryId = transfer.categoryPath[transfer.categoryPath.length - 1].id;
                        this.splitTransfer.description = transfer.description;
                        console.log(this.transfer.otherTransfers);
                    });
            } else {
                this.navigator.goToNotFoundPage();
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
                    if (result.insertedId) {
                        this.navigator.goTo(NavigatorPages.TransferDetails(result.insertedId));
                    }
                });
    }

    public onClickRefundTransfer(): void {
        this.coinageData.refundTransfer(this.transfer.id, new Date()).subscribe((result) => {
            if (result && result.insertedId) {
                this.notificationService.push({
                    title: `Added Refund`,
                    message: result.message ?? 'Refunded succesfully.',
                    linkTo: NavigatorPages.TransferDetails(result.insertedId),
                });

                // TODO: Find better way to reload page/data after creating a refund
                this.router
                    .navigateByUrl(`/`, { skipLocationChange: true })
                    .then(() => this.router.navigateByUrl(NavigatorPages.TransferDetails(this.transfer.id), { skipLocationChange: true }));
            }
        });
    }

    public onClickDuplicateTransfer(): void {
        this.coinageData.duplicateTransfer(this.transfer.id).subscribe((result) => {
            if (result && result.insertedId) {
                this.notificationService.push({
                    title: `Transfer Duplicated`,
                    message: 'Remember to save edited transfer',
                });

                this.navigator.goTo(NavigatorPages.TransferEdit(result.insertedId));
            }
        });
    }

    public onClickEditMode(): void {
        if (this.transfer) {
            this.navigator.goTo(NavigatorPages.TransferEdit(this.transfer.id));
        }
    }

    public get receiptDetailsLink(): string | undefined {
        if (this.transfer.receipt?.id) {
            return NavigatorPages.ReceiptDetails(this.transfer.receipt?.id);
        }
    }

    public get refundedByLink(): string | undefined {
        if (this.transfer.refundedBy) {
            return NavigatorPages.TransferDetails(this.transfer.refundedBy);
        }
    }

    public get transferTypeDisplayName(): string {
        return TransferType[this.transfer.type].displayName;
    }

    public get transferTypeDisplaySymbol(): string {
        return TransferType[this.transfer.type].symbol;
    }

    public get isOutcome(): boolean {
        return this.transfer.type === TransferTypeEnum.OUTCOME;
    }
}
