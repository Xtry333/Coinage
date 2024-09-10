import { Component, EventEmitter, Input, OnInit, Output, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as Rx from 'rxjs';
import { finalize } from 'rxjs/operators';

import {
    AccountDTO,
    CategoryDTO,
    ContractorDTO,
    CreateMultipleTransfersDTO,
    ExistingItem,
    ItemWithLastUsedPriceDTO,
    TransferDetailsDTO,
} from '@coinage-app/interfaces';

import { SelectedTransferItemDetails } from './item-details-for-transfer/item-details-for-transfer.component';
import { NewTransferDetailsComponent, SelectedDetails } from './new-transfer-details/new-transfer-details.component';
import { CoinageStorageService } from '../core/services/storage-service/coinage-storage.service';
import { StorageScope } from '../core/services/storage-service/storage-scope.enum';
import { CoinageDataService } from '../services/coinage.data-service';
import { NavigatorService } from '../services/navigator.service';
import { NotificationService } from '../services/notification.service';

export interface NewTransferObject {
    description: string;
    amount: number;
    transferDate: string;
    categoryId?: number;
    contractorId?: number | null;
    accountId?: number;
}

@Component({
    selector: 'app-create-multiple-transfers',
    templateUrl: './create-multiple-transfers.component.html',
    styleUrls: ['./create-multiple-transfers.component.scss'],
})
export class CreateMultipleTransfersComponent implements OnInit {
    public static readonly SAVED_ITEMS = 'createTransfers.selectedItems';

    public showPage = true;

    public categories: CategoryDTO[] = [];
    public contractors: ContractorDTO[] = [];
    public accounts: AccountDTO[] = [];
    public allItems: ItemWithLastUsedPriceDTO[] = [];
    public transferDTO?: TransferDetailsDTO;
    public selectedDetails?: SelectedDetails;

    public itemsInTransfers: SelectedTransferItemDetails[] = [];

    public shouldDisplayShoppingList = false;
    public shouldOverrideTotalCostOnChange = true;

    @ViewChildren('newTransferDetails')
    private newTransferDetailsComponent?: QueryList<NewTransferDetailsComponent>;

    @Input() public redirectAfterSave = true;

    @Output() public saveSuccess = new EventEmitter<number[]>();

    public constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly navigator: NavigatorService,
        private readonly dataService: CoinageDataService,
        private readonly notificationService: NotificationService,
        private readonly storage: CoinageStorageService,
    ) {
        this.initInputData();
    }

    public ngOnInit(): void {
        this.showPage = false;
        Rx.zip([
            this.dataService.getCategoryList(),
            this.dataService.getContractorList(),
            this.dataService.getAllAvailableAccounts(),
            this.dataService.getAllItems(),
        ])
            .pipe(
                finalize(() => {
                    this.showPage = true;
                }),
            )
            .subscribe(([categories, contractors, accounts, items]) => {
                this.categories = categories;
                this.contractors = contractors;
                this.accounts = accounts;
                this.allItems = items;

                this.initInputData();
            });
    }

    public onCommonDetailsChanged(selected: SelectedDetails): void {
        this.selectedDetails = selected;
    }

    public onItemAdded(item: SelectedTransferItemDetails) {
        this.itemsInTransfers.push(item);
        this.itemsInTransfers = Object.assign([], this.itemsInTransfers);
        this.storage.setObject(CreateMultipleTransfersComponent.SAVED_ITEMS, this.itemsInTransfers, StorageScope.Session);
    }

    public onItemRemoved(item: SelectedTransferItemDetails) {
        const index = this.itemsInTransfers.indexOf(item);
        if (index > -1) {
            this.itemsInTransfers.splice(index, 1);
        }
        this.itemsInTransfers = Object.assign([], this.itemsInTransfers);
        this.storage.setObject(CreateMultipleTransfersComponent.SAVED_ITEMS, this.itemsInTransfers, StorageScope.Session);
    }

    private initInputData(): void {
        this.itemsInTransfers = this.storage.getObject(CreateMultipleTransfersComponent.SAVED_ITEMS, StorageScope.Session) ?? [];
    }

    private clearItemList(): void {
        this.itemsInTransfers = [];
        this.storage.setObject(CreateMultipleTransfersComponent.SAVED_ITEMS, [], StorageScope.Session);
    }

    public async onClickCreateTransfer(): Promise<void> {
        console.log(this.itemsInTransfers);
        if (!this.selectedDetails?.accountId) {
            this.newTransferDetailsComponent?.first.highlightAccountSelect();
            throw new Error('Select account!');
        }
        const dto: CreateMultipleTransfersDTO = {
            amount: 0,
            mainCategoryId: 1,
            contractorId: this.selectedDetails?.contractorId ?? null,
            accountId: this.selectedDetails?.accountId,
            receiptId: null,
            date: new Date(`${this.selectedDetails.transferDate} 12:00`),
            items: this.itemsInTransfers.map((i) => new ExistingItem(i.id ?? 0, i.amount, i.unitPrice, i.setDiscount ?? 0)),
        };
        const result = await this.dataService.postCreateAdvancedTransfers(dto);
        console.log(result);
        if (result.insertedIds) {
            this.notificationService.push({
                title: `Transfers Created`,
                message: `Inserted IDs: ${result.insertedIds.join(', ')}`,
            });
            this.initInputData();
            this.saveSuccess.emit(result.insertedIds);
            this.navigator.goToDashboardPage();
        } else {
            this.notificationService.push({
                title: `There was an error`,
                message: result.error ?? ':',
            });
        }
        this.clearItemList();
    }

    public onClickClearItemList(): void {
        this.clearItemList();
    }
}
