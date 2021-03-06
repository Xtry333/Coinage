import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { ItemDTO } from '@coinage-app/interfaces';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { CoinageDataService } from '../../services/coinage.data-service';
import { ShoppingListItem } from './editable-shop-list-item/editable-shop-list-item.component';

@Component({
    selector: 'coinage-app-item-shopping-list',
    templateUrl: './item-shopping-list.component.html',
    styleUrls: ['./item-shopping-list.component.scss'],
})
export class ItemShoppingListComponent implements OnInit, OnChanges {
    public removeIcon = faTrash;
    public allItems: ItemDTO[] = [];
    public itemsLoading = true;

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
    }

    public get itemsLoaded(): boolean {
        return this.allItems.length > 0;
    }

    public onRemoveItem(item: ShoppingListItem): void {
        this.itemList = this.itemList.filter((listItem) => listItem !== item);
        this.itemListChanged.emit(this.itemList);
        this.recalculateAndEmitTotalCost();
    }

    private recalculateAndEmitTotalCost(): void {
        const totalCost = Number(this.itemList.reduce((acc, curr) => acc + curr.price * curr.amount, 0).toFixed(4));
        this.totalCostChanged.emit(totalCost);
    }
}
