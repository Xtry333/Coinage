import { Component, EventEmitter, Input, OnChanges, OnInit, Output, QueryList, ViewChildren } from '@angular/core';
import { ContainerDTO, CreateEditItemDTO, ItemWithLastUsedPriceDTO, ShoppingListItem } from '@app/interfaces';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { NgSelectComponent } from '@ng-select/ng-select';
import { CoinageDataService } from '../../services/coinage.data-service';
import { NotificationService } from '../../services/notification.service';

@Component({
    selector: 'app-item-shopping-list',
    templateUrl: './item-shopping-list.component.html',
    styleUrls: ['./item-shopping-list.component.scss'],
    standalone: false,
})
export class ItemShoppingListComponent implements OnInit, OnChanges {
    public removeIcon = faTrash;
    public allItems: ItemWithLastUsedPriceDTO[] = [];
    public searchableItems: ItemWithLastUsedPriceDTO[] = this.allItems;
    public itemsLoading = true;
    public prioritizedContainers: ContainerDTO[] = [];
    public otherContainers: ContainerDTO[] = [];
    public containersWithDisplayNames: (ContainerDTO & { displayName: string })[] = [];

    @ViewChildren('itemSelect') private itemSelect?: QueryList<NgSelectComponent>;

    @Input() public selectedCategoryId: number | null = null;
    @Input() public preselectedItems: ShoppingListItem[] = [];
    @Input() public containers: ContainerDTO[] = [];

    @Output() public itemListChanged = new EventEmitter<ShoppingListItem[]>();
    @Output() public totalCostChanged = new EventEmitter<number>();

    public selectedItem: ShoppingListItem = new ShoppingListItem(undefined, '', 1, 0, 0, 0, 0, null);
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
        this.organizeContainers();
        this.loadContainersForPreselectedItems();
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
        );
        this.itemList.push(shoppingItem);
        this.recalculateAndEmitTotalCost();
        this.itemSelect?.first.handleClearClick();
        this.selectedItem.price = 0;
        this.selectedItem.amount = 1;
        this.selectedItem.containerId = null;
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

        if (selected.id) {
            this.loadContainersForItem(selected.id);
        }
    }

    private recalculateAndEmitTotalCost(): void {
        const totalCost = Number(this.itemList.reduce((acc, curr) => acc + curr.price * curr.amount, 0).toFixed(2));
        this.totalCostChanged.emit(totalCost);
        this.itemListChanged.emit(this.itemList);
    }

    private organizeContainers(): void {
        this.prioritizedContainers = [];
        this.otherContainers = this.containers;
        this.updateContainersWithDisplayNames();
    }

    private updateContainersWithDisplayNames(): void {
        const prioritized = this.prioritizedContainers.map((container) => ({
            ...container,
            displayName: this.getContainerDisplayName(container),
        }));

        const others = this.otherContainers.map((container) => ({
            ...container,
            displayName: this.getContainerDisplayName(container),
        }));

        this.containersWithDisplayNames = [...prioritized, ...others];
    }

    private async loadContainersForItem(itemId: number): Promise<void> {
        try {
            const usedContainers = await this.coinageDataService.getContainersUsedWithItem(itemId);
            const usedContainerIds = new Set(usedContainers.map((c) => c.id));

            this.prioritizedContainers = usedContainers;
            this.otherContainers = this.containers.filter((c) => !usedContainerIds.has(c.id));
            this.updateContainersWithDisplayNames();
        } catch (error) {
            console.error('Failed to load containers for item:', error);
            this.organizeContainers();
        }
    }

    private async loadContainersForPreselectedItems(): Promise<void> {
        if (!this.itemList.length) {
            return;
        }

        const allUsedContainerIds = new Set<number>();

        for (const item of this.itemList) {
            if (item.id) {
                try {
                    const usedContainers = await this.coinageDataService.getContainersUsedWithItem(item.id);
                    usedContainers.forEach((container) => allUsedContainerIds.add(container.id));
                } catch (error) {
                    console.error(`Failed to load containers for item ${item.id}:`, error);
                }
            }
        }

        this.prioritizedContainers = this.containers.filter((c) => allUsedContainerIds.has(c.id));
        this.otherContainers = this.containers.filter((c) => !allUsedContainerIds.has(c.id));
        this.updateContainersWithDisplayNames();
    }
}
