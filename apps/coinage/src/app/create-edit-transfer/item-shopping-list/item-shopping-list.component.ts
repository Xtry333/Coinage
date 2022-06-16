import { Component, EventEmitter, Input, OnChanges, OnInit, Output, QueryList, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { ItemWithLastUsedPriceDTO } from '@coinage-app/interfaces';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { NgSelectComponent } from '@ng-select/ng-select';
import { CoinageDataService } from '../../services/coinage.data-service';
import { ShoppingListItem } from './editable-shop-list-item/editable-shop-list-item.component';

@Component({
    selector: 'coinage-app-item-shopping-list',
    templateUrl: './item-shopping-list.component.html',
    styleUrls: ['./item-shopping-list.component.scss'],
})
export class ItemShoppingListComponent implements OnInit, OnChanges {
    public removeIcon = faTrash;
    public allItems: ItemWithLastUsedPriceDTO[] = [];
    public searchableItems: ItemWithLastUsedPriceDTO[] = this.allItems;
    public itemsLoading = true;

    @ViewChildren('itemSelect') private itemSelect?: QueryList<NgSelectComponent>;

    @Input() public selectedCategoryId: number | null = null;
    @Input() public preselectedItems: ShoppingListItem[] = [];

    @Output() public itemListChanged = new EventEmitter<ShoppingListItem[]>();
    @Output() public totalCostChanged = new EventEmitter<number>();

    public selectedItem: ShoppingListItem = new ShoppingListItem(undefined, '', 1, 0, 0);
    public itemList: ShoppingListItem[] = [];

    public constructor(private readonly coinageDataService: CoinageDataService) {}

    public ngOnInit(): void {
        this.loadItems();
    }

    public ngOnChanges(): void {
        this.itemList = this.preselectedItems ?? [];
        this.filterItems();
    }

    public loadItems(): void {
        this.coinageDataService
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
        this.searchableItems = this.allItems.filter((item) => this.selectedCategoryId === null || item.categoryId === this.selectedCategoryId);
    }

    public onClickAddNewItemToList(): void {
        console.log(this.selectedItem);
        const item = this.allItems.find((item) => item.id === this.selectedItem.id);
        const shoppingItem = new ShoppingListItem(
            item?.id,
            item?.name ?? this.selectedItem.name,
            this.selectedItem.amount,
            this.selectedItem.price,
            item?.categoryId ?? 0
        );
        this.itemList.push(shoppingItem);
        this.recalculateAndEmitTotalCost();
        this.itemSelect?.first.handleClearClick();
    }

    public onRemoveItemFromList(item: ShoppingListItem): void {
        this.itemList = this.itemList.filter((listItem) => listItem !== item);
        this.recalculateAndEmitTotalCost();
    }

    public onItemSelected(selected: ShoppingListItem): void {
        if (selected === undefined) {
            return;
        }
        const item = this.allItems.find((item) => item.id === selected.id);
        if (item && item.lastUnitPrice !== null) {
            this.selectedItem.price = item.lastUnitPrice;
        }
    }

    private recalculateAndEmitTotalCost(): void {
        const totalCost = Number(this.itemList.reduce((acc, curr) => acc + curr.price * curr.amount, 0).toFixed(2));
        this.totalCostChanged.emit(totalCost);
        this.itemListChanged.emit(this.itemList);
    }
}
