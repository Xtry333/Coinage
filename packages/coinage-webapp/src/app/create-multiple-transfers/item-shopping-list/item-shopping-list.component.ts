import { Component, EventEmitter, Input, OnChanges, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { CreateEditItemDTO, ItemDTO, ItemWithLastUsedPriceDTO, ShoppingListItem } from '@coinage-app/interfaces';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { NgSelectComponent } from '@ng-select/ng-select';
import { CoinageDataService } from '../../services/coinage.data-service';
import { NotificationService } from '../../services/notification.service';

@Component({
    selector: 'app-item-details-for-receipt',
    templateUrl: './item-shopping-list.component.html',
    styleUrls: ['./item-shopping-list.component.scss'],
})
export class ItemDetailsForReceiptComponent implements OnInit, OnChanges {
    public removeIcon = faTrash;
    public allItems: ItemWithLastUsedPriceDTO[] = [];
    public searchableItems: ItemWithLastUsedPriceDTO[] = this.allItems;
    public itemsLoading = true;

    @ViewChildren('itemSelect')
    private itemSelect?: QueryList<NgSelectComponent>;

    @Input() public selectedCategoryId: number | null = null;
    @Input() public preselectedItems: ShoppingListItem[] = [];

    @Output() public itemListChanged = new EventEmitter<ShoppingListItem[]>();
    @Output() public totalCostChanged = new EventEmitter<number>();

    public selectedItem: ShoppingListItem = new ShoppingListItem(undefined, '', 1, 0, 0);
    public itemList: ShoppingListItem[] = [];

    public constructor(private readonly dataService: CoinageDataService, private readonly notificationService: NotificationService) {}

    public ngOnInit(): void {
        this.loadItems();
    }

    public ngOnChanges(): void {
        this.itemList = this.preselectedItems ?? [];
        this.filterItems();
    }

    public loadItems(): void {
        this.dataService
            .getAllItems()
            .then((items) => {
                console.log(items);
                this.allItems = items;
                this.filterItems();
            })
            .finally(() => {
                this.itemsLoading = false;
            });
    }

    public get itemsLoaded(): boolean {
        return this.allItems.length > 0;
    }

    private filterItems(): void {
        this.searchableItems = this.allItems; //.filter((item) => this.selectedCategoryId === null || item.categoryId === this.selectedCategoryId);
    }

    public async onAddNewItem(name: string): Promise<ItemWithLastUsedPriceDTO> {
        if (this.selectedCategoryId === null) {
            throw new Error();
        }
        const item = new CreateEditItemDTO(null, null, name, this.selectedCategoryId, null, null);
        const response = await this.dataService.postCreateItem(item);
        if (response.insertedId) {
            this.notificationService.push({ title: `Item Created`, message: name });
        }
        const addedItem: ItemWithLastUsedPriceDTO = { id: response.insertedId ?? 0, name, categoryId: 0, lastUnitPrice: 0, lastUsedDate: null };
        this.allItems.push(addedItem);
        return addedItem;
    }

    public onRemoveItemFromList(item: ShoppingListItem): void {
        this.itemList = this.itemList.filter((listItem) => listItem !== item);
        this.recalculateAndEmitTotalCost();
    }

    private recalculateAndEmitTotalCost(): void {
        const totalCost = Number(this.itemList.reduce((acc, curr) => acc + curr.price * curr.amount, 0).toFixed(2));
        this.totalCostChanged.emit(totalCost);
        this.itemListChanged.emit(this.itemList);
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

        this.localStorage.setObject(CreateMultipleTransfersComponent.SAVED_ITEMS, this.itemList);
    }
}
