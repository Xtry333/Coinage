import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { faClock, faFeatherAlt, faReceipt, faReply } from '@fortawesome/free-solid-svg-icons';
import * as Rx from 'rxjs';

import { CategoryDTO, SplitTransferDTO, TransferDetailsDTO, TransferType, TransferTypeEnum } from '@coinage-app/interfaces';

import { CoinageDataService } from '../services/coinage.data-service';
import { NavigatorPages, NavigatorService } from '../services/navigator.service';
import { NotificationService } from '../services/notification.service';

@Component({
    selector: 'app-transfer-details',
    templateUrl: './transfer-details.component.html',
    styleUrls: ['./transfer-details.component.scss'],
})
export class TransferDetailsComponent implements OnInit, OnDestroy {
    public plannedIcon: IconDefinition = faClock;
    public receiptIcon: IconDefinition = faReceipt;
    public refundedIcon: IconDefinition = faReply;
    public etherealIcon: IconDefinition = faFeatherAlt;

    public showPage = false;
    public transfer!: TransferDetailsDTO;

    public NavigatorPages = NavigatorPages;

    public splitTransfer: SplitTransferDTO = { id: 0, description: '', amount: 0, categoryId: 0 };
    public totalPayment = 0;
    public shouldShowSplit = false;
    public routeSubscription!: Rx.Subscription;

    public categories: CategoryDTO[] = [];

    public constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly navigator: NavigatorService,
        private readonly coinageData: CoinageDataService,
        private readonly notificationService: NotificationService
    ) {}

    public ngOnInit(): void {
        this.showPage = false;
        this.routeSubscription = this.route.paramMap.subscribe((params) => {
            const id = parseInt(params.get('id') ?? '');
            if (id) {
                this.loadTransferDetails(id);
            } else {
                this.navigator.goToNotFoundPage();
            }
        });
    }

    public ngOnDestroy(): void {
        this.routeSubscription.unsubscribe();
    }

    private loadTransferDetails(id: number): void {
        this.coinageData
            .getTransferDetails(id)
            .then((transfer) => {
                this.transfer = transfer;
                this.totalPayment =
                    transfer.amount * TransferType[transfer.type].mathSymbol +
                    transfer.otherTransfers.reduce((a, t) => a + t.amount * TransferType[t.type].mathSymbol, 0);

                console.log(this.transfer);
            })
            .catch(() => {
                this.notificationService.push({
                    title: 'Error',
                    message: 'Transfer not found',
                });
                this.navigator.goTo(NavigatorPages.Dashboard());
                throw 404;
            })
            .finally(() => {
                this.showPage = true;
            });
    }

    public onToggleShowSplit(): void {
        this.shouldShowSplit = !this.shouldShowSplit;
        if (this.shouldShowSplit) {
            this.splitTransfer.amount = +(this.transfer.amount / 2).toFixed(2);
            this.splitTransfer.categoryId = this.transfer.categoryPath[this.transfer.categoryPath.length - 1].id;
            this.splitTransfer.description = this.transfer.description;
            Rx.lastValueFrom(this.coinageData.getCategoryList()).then((categories) => {
                this.categories = categories;
            });
        }
    }

    public onClickSplitTransfer(): void {
        if (this.transfer)
            this.coinageData
                .postSplitTransaction(this.transfer.id, {
                    id: this.transfer.id,
                    description: this.splitTransfer.description,
                    amount: parseFloat(this.splitTransfer.amount?.toString()) ?? null,
                    categoryId: this.splitTransfer.categoryId,
                })
                .then((result) => {
                    this.shouldShowSplit = false;
                    if (result.insertedId) {
                        this.navigator.goTo(NavigatorPages.TransferDetails(result.insertedId));
                    }
                });
    }

    public onClickRefundTransfer(): void {
        this.coinageData.postRefundTransfer(this.transfer.id, new Date()).subscribe((result) => {
            if (result && result.insertedId) {
                this.notificationService.push({
                    title: `Added Refund`,
                    message: result.message ?? 'Refunded succesfully.',
                    linkTo: NavigatorPages.TransferDetails(result.insertedId),
                });

                this.loadTransferDetails(this.transfer.id);
            }
        });
    }

    public onClickDuplicateTransfer(): void {
        this.coinageData.postDuplicateTransfer(this.transfer.id).subscribe((result) => {
            if (result && result.insertedId) {
                this.notificationService.push({
                    title: `Transfer Duplicated`,
                    message: 'Remember to save edited transfer',
                });

                this.navigator.goTo(NavigatorPages.TransferEdit(result.insertedId), true);
            }
        });
    }

    public onClickEditMode(): void {
        if (this.transfer) {
            this.navigator.goTo(NavigatorPages.TransferEdit(this.transfer.id), true);
        }
    }

    public onClickCommit(): void {
        if (this.transfer) {
            this.coinageData.postCommitTransfer(this.transfer.id).finally(() => {
                this.router
                    .navigateByUrl(`/`, { skipLocationChange: true })
                    .then(() => this.router.navigateByUrl(NavigatorPages.TransferDetails(this.transfer.id), { skipLocationChange: true }));
            });
        }
    }

    public get receiptDetailsLink(): string | undefined {
        if (this.transfer.receipt?.id) {
            return NavigatorPages.ReceiptDetails(this.transfer.receipt?.id);
        }
        return undefined;
    }

    public get refundedByLink(): string | undefined {
        if (this.transfer.refundedBy) {
            return NavigatorPages.TransferDetails(this.transfer.refundedBy);
        }
        return undefined;
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

    public get isSplittable(): boolean {
        return this.transfer.amount > 0;
    }
}
