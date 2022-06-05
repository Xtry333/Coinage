import { Component, EventEmitter, Input, OnChanges, OnInit, Output, QueryList, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { ItemDTO, ItemWithLastUsedPriceDTO } from '@coinage-app/interfaces';
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
    public itemsLoading = true;

    @ViewChildren('itemSelect')
    private itemSelect?: QueryList<NgSelectComponent>;

    @Input() public preselectedItems: ShoppingListItem[] = [];

    @Output() public itemListChanged = new EventEmitter<ShoppingListItem[]>();
    @Output() public totalCostChanged = new EventEmitter<number>();

    public selectedItem: ShoppingListItem = new ShoppingListItem(undefined, '', 1, 0);
    public selectedItemId: number | undefined;

    public itemList: ShoppingListItem[] = [];

    public constructor(private readonly coinageDataService: CoinageDataService) {}

    public ngOnInit(): void {
        console.log(this);
        this.loadItems();
    }

    public ngOnChanges(): void {
        this.itemList = this.preselectedItems;
    }

    public loadItems(): void {
        this.coinageDataService
            .getAllItems()
            .then((items) => {
                console.log(items);
                this.allItems = items;
            })
            .finally(() => {
                this.itemsLoading = false;
            });
    }

    public onClickAddNewItemToList(): void {
        console.log(this.selectedItem);
        const item = this.allItems.find((item) => item.id === this.selectedItem.id);
        const shoppingItem = new ShoppingListItem(item?.id, item?.name ?? this.selectedItem.name, this.selectedItem.amount, this.selectedItem.price);
        this.itemList.push(shoppingItem);
        this.itemListChanged.emit(this.itemList);
        this.recalculateAndEmitTotalCost();
        this.itemSelect?.first.handleClearClick();
    }

    public get itemsLoaded(): boolean {
        return this.allItems.length > 0;
    }

    public onRemoveItem(item: ShoppingListItem): void {
        this.itemList = this.itemList.filter((listItem) => listItem !== item);
        this.itemListChanged.emit(this.itemList);
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
    }
}
