import { Component, EventEmitter, Input, OnInit, Output, QueryList, ViewChildren } from '@angular/core';
import { faMagicWandSparkles, faTrash } from '@fortawesome/free-solid-svg-icons';
import { NgSelectComponent } from '@ng-select/ng-select';

import { ItemWithLastUsedPriceDTO, ShoppingListItem } from '@coinage-app/interfaces';

import { CoinageStorageService } from '../../core/services/storage-service/coinage-storage.service';
import { CoinageDataService } from '../../services/coinage.data-service';
import { NotificationService } from '../../services/notification.service';

export interface SelectedTransferItemDetails {
    id: number | undefined;
    name: string;
    amount: number;
    categoryId: number;
    unitPrice: number;
    totalPrice: number;
    setDiscount: number | undefined;
}

@Component({
    selector: 'app-item-details-for-transfer',
    templateUrl: './item-details-for-transfer.component.html',
    styleUrls: ['./item-details-for-transfer.component.scss'],
})
export class AddItemsToTransferComponent implements OnInit {
    public removeIcon = faTrash;
    public autoAdjustIcon = faMagicWandSparkles;
    public autoAdjustTitleText = 'This field automagically adjusts according to other fields. Click to move to last changed field.';

    public allItems: ItemWithLastUsedPriceDTO[] = [];
    public allContainers: ItemWithLastUsedPriceDTO[] = [];

    public itemsLoading = true;

    @ViewChildren('itemSelect')
    private itemSelect?: QueryList<NgSelectComponent>;

    @Input() public selectedItems: ShoppingListItem[] = [];

    @Output() public itemListChanged = new EventEmitter<ShoppingListItem[]>();
    @Output() public itemAdded = new EventEmitter<SelectedTransferItemDetails>();

    public selectedItemDetails: SelectedTransferItemDetails;
    public itemList: ShoppingListItem[] = [];

    private dataChangedHistory: (keyof SelectedTransferItemDetails)[] = ['totalPrice', 'unitPrice', 'amount'];

    public constructor(
        private readonly dataService: CoinageDataService,
        private readonly notificationService: NotificationService,
        private readonly storage: CoinageStorageService,
    ) {
        this.selectedItemDetails = {
            id: undefined,
            amount: 1,
            name: '',
            categoryId: 0,
            unitPrice: 1,
            totalPrice: 1,
            setDiscount: 0,
        };
    }

    public ngOnInit(): void {
        this.loadItems();
    }

    public loadItems(): void {
        this.dataService
            .getAllItems()
            .then((items) => {
                this.allItems = items;
            })
            .finally(() => {
                this.itemsLoading = false;
            });
    }

    public clearFields(): void {
        this.selectedItemDetails = {
            id: undefined,
            amount: 1,
            name: '',
            categoryId: 0,
            unitPrice: 1,
            totalPrice: 1,
            setDiscount: 0,
        };
        this.itemSelect?.first.handleClearClick();
    }

    public get itemsLoaded(): boolean {
        return this.allItems.length > 0;
    }

    public onRemoveItemFromList(item: ShoppingListItem): void {
        this.itemList = this.itemList.filter((listItem) => listItem !== item);
    }

    public categorisedItemList: {
        name: string;
        items: ShoppingListItem[];
    }[] = []; //this.getShoppingListByCategories();

    public onItemSelected(selected: ShoppingListItem): void {
        if (selected !== undefined) {
            const item = this.allItems.find((item) => item.id === selected.id);
            if (item && item.lastUnitPrice !== null) {
                this.pushLastDataChangedHistory('unitPrice');
                this.selectedItemDetails.name = item.name;
                this.selectedItemDetails.categoryId = item.categoryId;
                this.selectedItemDetails.unitPrice = item.lastUnitPrice;
            }
        }
        this.onItemDetailsChanged();
    }

    public onContainerSelected(selected: ShoppingListItem): void {
        // NOOP
    }

    public onAmountChanged(): void {
        this.pushLastDataChangedHistory('amount');
        this.onItemDetailsChanged();
    }

    public onUnitPriceChanged(): void {
        this.pushLastDataChangedHistory('unitPrice');
        this.onItemDetailsChanged();
    }

    public onTotalPriceChanged(): void {
        this.pushLastDataChangedHistory('totalPrice');
        this.onItemDetailsChanged();
    }

    public onItemDetailsChanged(): void {
        if (this.dataChangedHistory.length === 3) {
            if (this.dataChangedHistory[0] === 'amount') {
                this.autoAdjustAmount();
            } else if (this.dataChangedHistory[0] === 'unitPrice') {
                this.autoAdjustUnitPrice();
            } else if (this.dataChangedHistory[0] === 'totalPrice') {
                this.autoAdjustTotalPrice();
            }
        }
    }

    public get canAutoAdjustAmount(): boolean {
        return this.dataChangedHistory[0] === 'amount';
    }

    public get canAutoAdjustUnitPrice(): boolean {
        return this.dataChangedHistory[0] === 'unitPrice';
    }

    public get canAutoAdjustTotalPrice(): boolean {
        return this.dataChangedHistory[0] === 'totalPrice';
    }

    private pushLastDataChangedHistory(data: keyof SelectedTransferItemDetails) {
        const index = this.dataChangedHistory.findIndex((d) => d === data);
        if (index >= 0) {
            this.dataChangedHistory.splice(index, 1);
        }
        this.dataChangedHistory.push(data);
    }

    private autoAdjustAmount(): void {
        this.selectedItemDetails.amount = Number((this.selectedItemDetails.totalPrice / this.selectedItemDetails.unitPrice).toFixed(3));
    }

    private autoAdjustUnitPrice(): void {
        this.selectedItemDetails.unitPrice = Number((this.selectedItemDetails.totalPrice / this.selectedItemDetails.amount).toFixed(2));
    }

    private autoAdjustTotalPrice(): void {
        this.selectedItemDetails.totalPrice = Number((this.selectedItemDetails.unitPrice * this.selectedItemDetails.amount).toFixed(2));
    }

    public onClickAddNewItemToList(): void {
        const item = this.allItems.find((item) => item.id === this.selectedItemDetails.id);
        const shoppingItem = new ShoppingListItem(
            item?.id,
            item?.name ?? this.selectedItemDetails.name,
            Number(this.selectedItemDetails.amount),
            Number(this.selectedItemDetails.unitPrice),
            Number(this.selectedItemDetails.totalPrice),
            Number(this.selectedItemDetails.setDiscount),
            item?.categoryId ?? 0,
        );
        const selectedItemDetails = Object.assign({}, this.selectedItemDetails);
        this.itemAdded.emit(selectedItemDetails);
        this.itemList.push(shoppingItem);
        //this.categorisedItemList = this.getShoppingListByCategories();
        this.itemSelect?.first.handleClearClick();
        this.selectedItemDetails.unitPrice = 0;
        this.selectedItemDetails.totalPrice = 0;
        this.selectedItemDetails.amount = 1;
        this.selectedItemDetails.setDiscount = 0;
    }

    public get itemDetailsInfo(): string {
        const details = this.selectedItemDetails;
        const setDiscountString = details.setDiscount ? ` - ${details.setDiscount}zł` : '';
        return `${details.name}, ${details.amount} x ${details.unitPrice}zł${setDiscountString} => ${details.totalPrice - (details.setDiscount ?? 0)}zł (${
            this.standardUnitaryPrice
        })`;
    }

    private get standardUnitaryPrice(): string {
        const details = this.selectedItemDetails;
        const item = this.allItems.find((item) => item.id === this.selectedItemDetails.id);
        if (item && item.containerSize !== null && item.containerSizeUnit !== null) {
            return `${(details.unitPrice / item.containerSize).toFixed(3)}zł/${item.containerSizeUnit}`;
        }
        return '';
    }
}
