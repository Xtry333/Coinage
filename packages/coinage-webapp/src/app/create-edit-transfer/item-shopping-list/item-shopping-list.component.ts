import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output, QueryList, ViewChildren } from '@angular/core';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { NgSelectComponent } from '@ng-select/ng-select';

import { ContainerDTO, CreateEditItemDTO, ItemPackagingDTO, ItemWithLastUsedPriceDTO, ShoppingListItem } from '@app/interfaces';

import { CoinageDataService } from '../../services/coinage.data-service';
import { NotificationService } from '../../services/notification.service';

@Component({
    selector: 'app-item-shopping-list',
    templateUrl: './item-shopping-list.component.html',
    styleUrls: ['./item-shopping-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
})
export class ItemShoppingListComponent implements OnInit, OnChanges {
    public removeIcon = faTrash;
    public allItems: ItemWithLastUsedPriceDTO[] = [];
    public searchableItems: ItemWithLastUsedPriceDTO[] = this.allItems;
    public itemsLoading = true;

    @ViewChildren('itemSelect') private itemSelect?: QueryList<NgSelectComponent>;

    @Input() public selectedCategoryId: number | null = null;
    @Input() public preselectedItems: ShoppingListItem[] = [];
    @Input() public containers: ContainerDTO[] = [];
    @Input() public shouldOverrideTotalCostOnChange: boolean = true;

    @Output() public itemListChanged = new EventEmitter<ShoppingListItem[]>();
    @Output() public totalCostChanged = new EventEmitter<number>();

    public selectedItem: ShoppingListItem = new ShoppingListItem(undefined, '', 1, 0, 0, 0, 0, null, null);
    public itemList: ShoppingListItem[] = [];

    public constructor(
        private readonly coinageDataService: CoinageDataService,
        private readonly notificationService: NotificationService,
    ) {}

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
        return !this.itemsLoading;
    }

    public getContainerDetails(containerId: number | null | undefined): string {
        if (!containerId) return '';

        const container = this.containers.find((c) => c.id === containerId);
        if (!container) return '';

        const parts: string[] = [];

        if (container.name) {
            parts.push(container.name);
        }

        if (container.weight && container.weightUnit) {
            parts.push(`${container.weight}${container.weightUnit}`);
        }

        if (container.volume && container.volumeUnit) {
            parts.push(`${container.volume}${container.volumeUnit}`);
        }

        return parts.length > 0 ? ` [${parts.join(', ')}]` : '';
    }

    public getContainerDisplayName(container: ContainerDTO): string {
        const parts: string[] = [];

        if (container.name) {
            parts.push(container.name);
        }

        const specs: string[] = [];
        if (container.weight && container.weightUnit) {
            specs.push(`${container.weight}${container.weightUnit}`);
        }

        if (container.volume && container.volumeUnit) {
            specs.push(`${container.volume}${container.volumeUnit}`);
        }

        if (specs.length > 0) {
            parts.push(`(${specs.join(', ')})`);
        }

        return parts.join(' ');
    }

    private filterItems(): void {
        this.searchableItems = this.allItems; //.filter((item) => this.selectedCategoryId === null || item.categoryId === this.selectedCategoryId);
    }

    public async onAddNewItem(name: string): Promise<ItemWithLastUsedPriceDTO> {
        if (this.selectedCategoryId === null) {
            throw new Error();
        }
        const item = new CreateEditItemDTO(null, null, name, this.selectedCategoryId, null, null);
        const response = await this.coinageDataService.postCreateItem(item);
        if (response.insertedId) {
            this.notificationService.push({ title: `Item Created`, message: name });
        }
        const addedItem: ItemWithLastUsedPriceDTO = {
            id: response.insertedId ?? 0,
            name,
            categoryId: 0,
            lastUnitPrice: 0,
            lastUsedDate: null,
            containerSize: null,
            containerSizeUnit: null,
            tags: [],
        };
        this.allItems.push(addedItem);
        return addedItem;
    }

    public onClickAddNewItemToList(): void {
        console.log(this.selectedItem);
        const item = this.allItems.find((item) => item.id === this.selectedItem.id);
        const shoppingItem = new ShoppingListItem(
            item?.id,
            item?.name ?? this.selectedItem.name,
            this.selectedItem.amount,
            this.selectedItem.price,
            this.selectedItem.price * this.selectedItem.amount,
            undefined,
            item?.categoryId ?? 0,
            this.selectedItem.containerId,
            null,
            item?.tags ?? [],
            this.selectedItem.packagingId,
        );
        this.itemList.push(shoppingItem);
        if (this.shouldOverrideTotalCostOnChange) {
            this.recalculateAndEmitTotalCost();
        } else {
            this.itemListChanged.emit(this.itemList);
        }
        this.itemSelect?.first.handleClearClick();
        this.selectedItem.price = 0;
        this.selectedItem.amount = 1;
        this.selectedItem.containerId = null;
        this.selectedItem.packagingId = undefined;
    }

    public onRemoveItemFromList(item: ShoppingListItem): void {
        this.itemList = this.itemList.filter((listItem) => listItem !== item);
        if (this.shouldOverrideTotalCostOnChange) {
            this.recalculateAndEmitTotalCost();
        } else {
            this.itemListChanged.emit(this.itemList);
        }
    }

    public onItemQuantityChanged(item: ShoppingListItem): void {
        item.totalPrice = item.amount * item.price;
        if (this.shouldOverrideTotalCostOnChange) {
            this.recalculateAndEmitTotalCost();
        }
    }

    public onItemPriceChanged(item: ShoppingListItem): void {
        item.totalPrice = item.amount * item.price;
        if (this.shouldOverrideTotalCostOnChange) {
            this.recalculateAndEmitTotalCost();
        }
    }

    public onItemContainerChanged(item: ShoppingListItem): void {
        // Container change doesn't affect pricing, just need to emit the updated item list
        this.itemListChanged.emit(this.itemList);
    }

    public onPackagingChanged(item: ShoppingListItem, packaging: ItemPackagingDTO | null): void {
        item.packagingId = packaging?.id ?? null;
        item.containerId = packaging?.containerId ?? null;
        if (this.itemList.includes(item)) this.itemListChanged.emit(this.itemList);
    }

    public onItemSelected(selected?: { id: number }): void {
        this.selectedItem.packagingId = undefined;
        this.selectedItem.containerId = null;
        if (!selected) {
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
