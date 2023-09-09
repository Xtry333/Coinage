import { Component, EventEmitter, Input, OnInit, Output, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgSelectComponent } from '@ng-select/ng-select';
import * as Rx from 'rxjs';
import { finalize } from 'rxjs/operators';

import {
    AccountDTO,
    CategoryDTO,
    ContractorDTO,
    CreateMultipleTransfersDTO,
    ExistingItem,
    ItemWithLastUsedPriceDTO,
    ShoppingListItem,
    TransferDetailsDTO,
} from '@coinage-app/interfaces';

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
    public static SAVED_ITEMS = 'receipt.saved-items';

    public showPage = true;

    public categories: CategoryDTO[] = [];
    public contractors: ContractorDTO[] = [];
    public accounts: AccountDTO[] = [];
    public allItems: ItemWithLastUsedPriceDTO[] = [];
    public transferDTO?: TransferDetailsDTO;
    public selectedDetails?: SelectedDetails;

    public itemsInTransfer: ShoppingListItem[] = [];

    public shouldDisplayShoppingList = false;
    public shouldOverrideTotalCostOnChange = true;

    @ViewChildren('newTransferDetails')
    private newTransferDetailsComponent?: QueryList<NewTransferDetailsComponent>;

    @ViewChildren('itemSelect')
    private itemSelect?: QueryList<NgSelectComponent>;

    @Input() public redirectAfterSave = true;

    @Output() public saveSuccess = new EventEmitter<number[]>();

    public constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly navigator: NavigatorService,
        private readonly dataService: CoinageDataService,
        private readonly notificationService: NotificationService,
        private readonly storage: CoinageStorageService
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
                })
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

    private initInputData(): void {
        this.itemList = this.storage.getObject(CreateMultipleTransfersComponent.SAVED_ITEMS, StorageScope.Session) ?? [];
        this.categorisedItemList = this.getShoppingListByCategories();
    }

    private clearItemList(): void {
        this.itemList = [];
        this.storage.setObject(CreateMultipleTransfersComponent.SAVED_ITEMS, null, StorageScope.Session);
        this.categorisedItemList = this.getShoppingListByCategories();
    }

    public selectedItemDetails: ShoppingListItem = new ShoppingListItem(undefined, '', 1, 0, 0, 0);
    public itemList: ShoppingListItem[] = [];
    public categorisedItemList: {
        name: string;
        items: ShoppingListItem[];
    }[] = this.getShoppingListByCategories();

    public onItemSelected(selected: ShoppingListItem): void {
        if (selected === undefined) {
            return;
        }
        const item = this.allItems.find((item) => item.id === selected.id);
        if (item && item.lastUnitPrice !== null) {
            this.selectedItemDetails.price = item.lastUnitPrice;
        }
        this.onItemDetailsChanged();
    }

    public onItemDetailsChanged(): void {
        const item = this.allItems.find((item) => item.id === this.selectedItemDetails.id);
        console.log(item);
        console.log(this.selectedItemDetails);
    }

    public onClickAddNewItemToList(): void {
        const item = this.allItems.find((item) => item.id === this.selectedItemDetails.id);
        const shoppingItem = new ShoppingListItem(
            item?.id,
            item?.name ?? this.selectedItemDetails.name,
            Number(this.selectedItemDetails.amount),
            Number(this.selectedItemDetails.price),
            Number(this.selectedItemDetails.setDiscount),
            item?.categoryId ?? 0
        );
        this.itemList.push(shoppingItem);
        this.categorisedItemList = this.getShoppingListByCategories();
        this.itemSelect?.first.handleClearClick();
        this.selectedItemDetails.price = 0;
        this.selectedItemDetails.amount = 1;
        this.selectedItemDetails.setDiscount = 0;

        this.storage.setObject(CreateMultipleTransfersComponent.SAVED_ITEMS, this.itemList);
    }

    public getShoppingListByCategories() {
        const categories = [...new Set(this.itemList.map((item) => item.categoryId ?? 0))].map((id) => {
            const category = this.categories.find((cat) => cat.id === id);
            if (!category) {
                return {
                    id: 0,
                    name: 'None',
                };
            }
            return category;
        });
        const categoryItems = [...categories].map((category) => {
            return {
                name: category.name,
                items: this.itemList.filter((item) => item.categoryId === category.id),
            };
        });
        return categoryItems;
    }

    public getItemTotalPrice(item: ShoppingListItem): number {
        const a = Number((item.price * item.amount).toFixed(2));
        //console.log(typeof a);
        return a;
    }

    public getItemTotalPriceWithDiscount(item: ShoppingListItem): number {
        return Number((item.price * item.amount - (item.setDiscount ?? 0)).toFixed(2));
    }

    public getTotalCategoryCost(items: ShoppingListItem[]): number {
        const a = Number(items.reduce((sum: number, item: ShoppingListItem) => sum + item.price * item.amount - (item.setDiscount ?? 0), 0).toFixed(2));
        //console.log(typeof a);
        return a;
    }

    public getItemsCost(items: ShoppingListItem[]): number {
        return Number(items.reduce((sum: number, item: ShoppingListItem) => sum + item.price * item.amount - (item.setDiscount ?? 0), 0).toFixed(2));
    }

    public async onClickCreateTransfer(): Promise<void> {
        console.log(this.itemList);
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
            date: new Date(),
            items: this.itemList.map((i) => new ExistingItem(i.id ?? 0, i.amount, i.price, i.setDiscount ?? 0)),
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
