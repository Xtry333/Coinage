import { Component, OnDestroy, OnInit } from '@angular/core';
import { CategoryDTO, ItemWithContainerDTO } from '@app/interfaces';
import { faBoxes, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Subject, takeUntil } from 'rxjs';

import { CoinageRoutes } from '../app-routing/app-routes';
import { CoinageDataService } from '../services/coinage.data-service';
import { FilterOption, FilterType, OnFilterEvent, PopupSide, TableFilterComponent } from '../transfers-table/table-filter/table-filter.component';

export enum ItemTableColumn {
    ItemName = 'ItemName',
    Category = 'Category',
    Container = 'Container',
    LastPrice = 'LastPrice',
    LastUsed = 'LastUsed',
}

export interface ItemTableFilterFields {
    itemName?: string;
    categoryIds?: number[];
    containerIds?: number[];
    lastPriceFrom?: number;
    lastPriceTo?: number;
    lastUsedFrom?: string;
    lastUsedTo?: string;
}

export type ItemsOptionsForCheckboxFilters = {
    categories: FilterOption[];
    containers: FilterOption[];
};

@Component({
    selector: 'app-items-list-table',
    templateUrl: './items-list-table.component.html',
    styleUrls: ['./items-list-table.component.scss'],
    standalone: false,
})
export class ItemsListTableComponent implements OnInit, OnDestroy {
    public static readonly EMPTY_CATEGORY = '(uncategorized)';

    public boxesIcon = faBoxes;
    public editIcon = faEdit;
    public trashIcon = faTrash;

    public items: ItemWithContainerDTO[] = [];
    public filteredItems: ItemWithContainerDTO[] = [];
    public currentPage = 1;
    public lastPageNumber = 1;
    private itemsPerPage = 50;

    public showFilters = true;
    public isAnyFilterApplied = false;

    public filter: ItemTableFilterFields = {};
    public optionsForCheckboxFilters: ItemsOptionsForCheckboxFilters = {
        categories: [],
        containers: [],
    };

    // Expose enums to template
    public ItemTableColumn = ItemTableColumn;
    public FilterType = FilterType;
    public PopupSide = PopupSide;
    public CoinageRoutes = CoinageRoutes;
    public EMPTY_CATEGORY = ItemsListTableComponent.EMPTY_CATEGORY;

    private destroy$ = new Subject<void>();

    public constructor(private readonly dataService: CoinageDataService) {}

    public ngOnInit(): void {
        this.loadItems();
        this.setupFilterOptions();
    }

    public ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadItems(): void {
        this.dataService
            .getItemsWithContainers()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (items) => {
                    this.items = items;
                    this.setupContainerFilterOptions();
                    this.applyFilters();
                    this.updatePagination();
                },
                error: (error) => {
                    console.error('Failed to load items:', error);
                },
            });
    }

    private setupFilterOptions(): void {
        this.dataService
            .getCategoryList()
            .pipe(takeUntil(this.destroy$))
            .subscribe((categories: CategoryDTO[]) => {
                this.optionsForCheckboxFilters.categories = categories.map((category) =>
                    TableFilterComponent.mapToFilterOptions(category.id, category.name, this.filter.categoryIds),
                );
            });
    }

    private setupContainerFilterOptions(): void {
        // Get unique containers from loaded items
        const uniqueContainers = new Map<number, string>();
        this.items.forEach((item) => {
            if (item.containerId && item.containerName) {
                uniqueContainers.set(item.containerId, item.containerName);
            }
        });

        this.optionsForCheckboxFilters.containers = Array.from(uniqueContainers.entries()).map(([id, name]) =>
            TableFilterComponent.mapToFilterOptions(id, name, this.filter.containerIds),
        );

        // Add "No Container" option for items without containers
        if (this.items.some((item) => !item.containerId)) {
            this.optionsForCheckboxFilters.containers.unshift(TableFilterComponent.mapToFilterOptions(0, 'No Container', this.filter.containerIds));
        }
    }

    public onPerformFilter(filterEvent: OnFilterEvent): void {
        switch (filterEvent.name) {
            case ItemTableColumn.ItemName:
                this.filter.itemName = filterEvent.filterType === FilterType.TextBox ? filterEvent.value : undefined;
                break;
            case ItemTableColumn.Category:
                this.filter.categoryIds = filterEvent.filterType === FilterType.MultiCheckbox ? filterEvent.selectedIds : undefined;
                break;
            case ItemTableColumn.Container:
                this.filter.containerIds = filterEvent.filterType === FilterType.MultiCheckbox ? filterEvent.selectedIds : undefined;
                break;
            case ItemTableColumn.LastPrice:
                if (filterEvent.filterType === FilterType.NumericRange) {
                    this.filter.lastPriceFrom = filterEvent.range.from;
                    this.filter.lastPriceTo = filterEvent.range.to;
                }
                break;
            case ItemTableColumn.LastUsed:
                if (filterEvent.filterType === FilterType.DateRange) {
                    this.filter.lastUsedFrom = filterEvent.range.from;
                    this.filter.lastUsedTo = filterEvent.range.to;
                }
                break;
        }
        this.applyFilters();
        this.updatePagination();
        this.currentPage = 1;
    }

    private applyFilters(): void {
        let filtered = [...this.items];

        // Item name filter (searches both brand and name)
        if (this.filter.itemName?.trim()) {
            const searchTerm = this.filter.itemName.toLowerCase();
            filtered = filtered.filter((item) => {
                const displayName = this.getDisplayName(item).toLowerCase();
                const itemName = item.name.toLowerCase();
                const brand = item.brand?.toLowerCase() || '';

                // Search in display name (brand + name), item name only, or brand only
                return displayName.includes(searchTerm) || itemName.includes(searchTerm) || brand.includes(searchTerm);
            });
        }

        // Category filter
        if (this.filter.categoryIds?.length) {
            filtered = filtered.filter((item) => this.filter.categoryIds!.includes(item.categoryId));
        }

        // Container filter
        if (this.filter.containerIds?.length) {
            filtered = filtered.filter((item) => {
                const itemContainerId = item.containerId || 0; // 0 represents "No Container"
                return this.filter.containerIds!.includes(itemContainerId);
            });
        }

        // Last price filter
        if (this.filter.lastPriceFrom !== undefined) {
            filtered = filtered.filter((item) => (item.lastUnitPrice ?? 0) >= this.filter.lastPriceFrom!);
        }
        if (this.filter.lastPriceTo !== undefined) {
            filtered = filtered.filter((item) => (item.lastUnitPrice ?? 0) <= this.filter.lastPriceTo!);
        }

        // Last used filter
        if (this.filter.lastUsedFrom) {
            const fromDate = new Date(this.filter.lastUsedFrom);
            filtered = filtered.filter((item) => {
                if (!item.lastUsedDate) return false;
                return new Date(item.lastUsedDate) >= fromDate;
            });
        }
        if (this.filter.lastUsedTo) {
            const toDate = new Date(this.filter.lastUsedTo);
            filtered = filtered.filter((item) => {
                if (!item.lastUsedDate) return false;
                return new Date(item.lastUsedDate) <= toDate;
            });
        }

        this.filteredItems = filtered;
        this.updateFilterStatus();
    }

    private updateFilterStatus(): void {
        this.isAnyFilterApplied =
            !!this.filter.itemName?.trim() ||
            !!this.filter.categoryIds?.length ||
            !!this.filter.containerIds?.length ||
            this.filter.lastPriceFrom !== undefined ||
            this.filter.lastPriceTo !== undefined ||
            !!this.filter.lastUsedFrom ||
            !!this.filter.lastUsedTo;
    }

    private updatePagination(): void {
        this.lastPageNumber = Math.ceil(this.filteredItems.length / this.itemsPerPage);
        if (this.lastPageNumber === 0) this.lastPageNumber = 1;
    }

    public onPageChanged(page: number): void {
        this.currentPage = page;
    }

    public get itemsForTable(): ItemWithContainerDTO[] {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.filteredItems.slice(startIndex, endIndex);
    }

    public get noRows(): boolean {
        return this.items.length === 0;
    }

    public get noRowsFound(): boolean {
        return this.filteredItems.length === 0;
    }

    public get hasAnyRows(): boolean {
        return this.itemsForTable.length > 0;
    }

    public itemIdTracker(index: number, item: ItemWithContainerDTO): number {
        return item.transferItemId || item.id; // Use transferItemId for uniqueness since items can have multiple containers
    }

    public formatContainer(item: ItemWithContainerDTO): string {
        if (item.containerName) {
            let result = item.containerName;

            // Add container details if available
            const details: string[] = [];
            if (item.containerWeight && item.containerWeightUnit) {
                details.push(`${item.containerWeight}${item.containerWeightUnit}`);
            }
            if (item.containerVolume && item.containerVolumeUnit) {
                details.push(`${item.containerVolume}${item.containerVolumeUnit}`);
            }

            if (details.length > 0) {
                result += ` (${details.join(', ')})`;
            }

            return result;
        }

        // Fallback to deprecated container size if no container entity
        if (item.containerSize && item.containerSizeUnit) {
            return `${item.containerSize}${item.containerSizeUnit} (deprecated)`;
        }

        return 'No container';
    }

    public getCategoryName(item: ItemWithContainerDTO): string {
        return item.categoryName || this.EMPTY_CATEGORY;
    }

    public calculateStandardPricePerLiter(item: ItemWithContainerDTO): string {
        if (!item.lastUnitPrice || !item.containerVolume || !item.containerVolumeUnit) {
            return '—';
        }

        let volumeInLiters = item.containerVolume;

        // Convert to liters based on unit
        switch (item.containerVolumeUnit) {
            case 'ml':
                volumeInLiters = item.containerVolume / 1000;
                break;
            case 'cl':
                volumeInLiters = item.containerVolume / 100;
                break;
            case 'l':
                // Already in liters
                break;
            default:
                return '—'; // Unknown unit
        }

        if (volumeInLiters <= 0) return '—';

        const pricePerLiter = item.lastUnitPrice / volumeInLiters;
        const currencyShorthand = item.lastUnitPriceCurrency || 'PLN';
        return `${this.formatCurrency(pricePerLiter, currencyShorthand)}/L`;
    }

    public calculateStandardPricePerKg(item: ItemWithContainerDTO): string {
        if (!item.lastUnitPrice || !item.containerWeight || !item.containerWeightUnit) {
            return '—';
        }

        let weightInKg = item.containerWeight;

        // Convert to kg based on unit
        switch (item.containerWeightUnit) {
            case 'g':
                weightInKg = item.containerWeight / 1000;
                break;
            case 'kg':
                // Already in kg
                break;
            default:
                return '—'; // Unknown unit
        }

        if (weightInKg <= 0) return '—';

        const pricePerKg = item.lastUnitPrice / weightInKg;
        const currencyShorthand = item.lastUnitPriceCurrency || 'PLN';
        return `${this.formatCurrency(pricePerKg, currencyShorthand)}/kg`;
    }

    private formatCurrency(value: number, currency: string): string {
        const CURRENCY_SYMBOL: Record<string, string> = { EUR: '€', PLN: 'zł' };

        switch (currency) {
            case 'EUR':
                return CURRENCY_SYMBOL[currency] + value.toFixed(2).replace('.', ',');
            case 'PLN':
                return value.toFixed(2).replace('.', ',') + ' ' + CURRENCY_SYMBOL[currency];
            default:
                return value.toFixed(2).replace('.', ',') + ' ' + currency;
        }
    }

    public getCurrencyCode(item: ItemWithContainerDTO): string {
        return item.lastUnitPriceCurrency || 'PLN';
    }

    public getDisplayName(item: ItemWithContainerDTO): string {
        if (item.brand?.trim()) {
            return `${item.brand} ${item.name}`;
        }
        return item.name;
    }
}
