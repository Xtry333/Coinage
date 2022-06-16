import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ItemDTO } from '@coinage-app/interfaces';

export class ShoppingListItem {
    public constructor(public id: number | undefined, public name: string, public amount: number, public price: number, public categoryId: number) {}
}

@Component({
    selector: 'coinage-app-editable-shop-list-item',
    templateUrl: './editable-shop-list-item.component.html',
    styleUrls: ['./editable-shop-list-item.component.scss'],
})
export class EditableShopListItemComponent {
    @Input() public allItems: ItemDTO[] = [];

    @Output() public totalCost = new EventEmitter<number>();

    public selectedItem: ShoppingListItem = new ShoppingListItem(undefined, '', 1, 0, 0);
    public selectedItemId: number | undefined;

    public itemList: ShoppingListItem[] = [];

    public onClickAddNewItemToList(): void {
        const item = this.allItems.find((item) => item.id === this.selectedItem.id);
        const shoppingItem = new ShoppingListItem(
            item?.id,
            item?.name ?? this.selectedItem.name,
            this.selectedItem.amount,
            this.selectedItem.price,
            this.selectedItem.categoryId
        );
        this.itemList.push(shoppingItem);
        this.totalCost.emit(this.itemList.reduce((acc, curr) => acc + curr.price * curr.amount, 0));
    }
}
