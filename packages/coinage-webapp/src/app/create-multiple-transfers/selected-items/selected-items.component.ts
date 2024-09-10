import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

import { CategoryDTO } from '@coinage-app/interfaces';

import { SelectedTransferItemDetails } from '../item-details-for-transfer/item-details-for-transfer.component';

@Component({
    selector: 'app-selected-items',
    templateUrl: './selected-items.component.html',
    styleUrls: ['./selected-items.component.scss'],
})
export class SelectedItemsComponent implements OnChanges {
    public removeIcon = faTrash;

    @Input() public items: SelectedTransferItemDetails[] = [];
    @Input() public categories: CategoryDTO[] = [];

    @Output() public removeItemClicked = new EventEmitter<SelectedTransferItemDetails>();

    public ngOnChanges(): void {
        this.categorisedItemList = this.getShoppingListByCategories();
    }

    public categorisedItemList: {
        name: string;
        items: SelectedTransferItemDetails[];
    }[] = [];

    public getItemTotalPrice(item: SelectedTransferItemDetails): number {
        const a = Number((item.unitPrice * item.amount).toFixed(2));
        //console.log(typeof a);
        return a;
    }

    public getItemTotalPriceWithDiscount(item: SelectedTransferItemDetails): number {
        return Number((item.unitPrice * item.amount - (item.setDiscount ?? 0)).toFixed(2));
    }

    public getTotalCategoryCost(items: SelectedTransferItemDetails[]): number {
        const a = Number(
            items.reduce((sum: number, item: SelectedTransferItemDetails) => sum + item.unitPrice * item.amount - (item.setDiscount ?? 0), 0).toFixed(2),
        );
        //console.log(typeof a);
        return a;
    }

    public getItemsCost(items: SelectedTransferItemDetails[]): number {
        return Number(
            items.reduce((sum: number, item: SelectedTransferItemDetails) => sum + item.unitPrice * item.amount - (item.setDiscount ?? 0), 0).toFixed(2),
        );
    }

    public removeItem(item: SelectedTransferItemDetails): void {
        this.removeItemClicked.emit(item);
    }

    public getShoppingListByCategories() {
        const categories = [...new Set(this.items.map((item) => item.categoryId ?? 0))].map((id) => {
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
                items: this.items.filter((item) => item.categoryId === category.id),
            };
        });
        return categoryItems;
    }
}
