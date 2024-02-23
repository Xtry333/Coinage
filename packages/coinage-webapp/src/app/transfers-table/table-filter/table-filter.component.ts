import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { IconDefinition, faCaretDown, faEdit, faFilter } from '@fortawesome/free-solid-svg-icons';

import { Range } from '@coinage-app/interfaces';

import { CoinageStorageService } from '../../core/services/storage-service/coinage-storage.service';

export enum FilterType {
    TextBox = 'TextBox',
    DateRange = 'DateRange',
    NumericRange = 'NumericRange',
    MultiCheckbox = 'MultiCheckbox',
}

export enum PopupSide {
    ToRight = 'ToRight',
    ToLeft = 'ToLeft',
}

export type OnTextBoxFilterEvent = {
    filterType: FilterType.TextBox;
    name: string;
    value: string;
};

export type OnMultiCheckboxFilterEvent = {
    filterType: FilterType.MultiCheckbox;
    name: string;
    selectedIds: number[];
};

export type OnNumericRangeFilterEvent = {
    filterType: FilterType.NumericRange;
    name: string;
    range: Range<number | undefined>;
};

export type OnDateRangeFilterEvent = {
    filterType: FilterType.DateRange;
    name: string;
    range: Range<Date | undefined>;
};

export type OnFilterEvent = OnTextBoxFilterEvent | OnNumericRangeFilterEvent | OnDateRangeFilterEvent | OnMultiCheckboxFilterEvent;

export interface FilterOption {
    id: number;
    uiText: string;
    isDisplayed?: boolean;
    isSelected?: boolean;
    searchValues: string[];
}

@Component({
    selector: 'app-table-filter[filterName]',
    templateUrl: './table-filter.component.html',
    styleUrls: ['./table-filter.component.scss'],
})
export class TableFilterComponent implements OnInit {
    public static readonly ITEMS_TO_DISPLAY_SEARCH_BOX = 5;
    public static readonly ITEMS_TO_DISPLAY_CHECK_ALL_BUTTON = 7;

    public PopupSides = PopupSide;

    public filterDefaultIcon = faCaretDown;
    public filterOpenIcon = faEdit;
    public filterAppliedIcon = faFilter;
    public isPopupDisplayed = false;

    public lastFilterValue?: OnFilterEvent;

    public optionSearchValue = '';

    @ViewChildren('autofocusedFilterInput')
    private autofocusedFilterInput!: QueryList<ElementRef<HTMLInputElement>>;

    @ViewChild('tableFilterElement')
    private tableFilterElement!: ElementRef<HTMLInputElement>;

    @Input() public popupSide = PopupSide.ToRight;
    @Input() public filterType = FilterType.TextBox;
    @Input() public filterName!: string;
    @Input() public datalist: string[] = [];
    @Input() public cachedFilterPrefix?: string;
    @Input() public cachedFilterValue?: string;
    @Input() public filterOptions?: FilterOption[];

    @Output() public filterEvent = new EventEmitter<OnFilterEvent>();
    @Output() public openEvent = new EventEmitter<void>();
    @Output() public closeEvent = new EventEmitter<void>();
    @Output() public focusEvent = new EventEmitter<boolean>();

    public filterValue: OnFilterEvent = TableFilterComponent.createEmptyFilterValue(this.filterType, this.filterName);

    public FilterType = FilterType;

    public static createEmptyFilterValue(filterType: FilterType, filterName: string): OnFilterEvent {
        switch (filterType) {
            case FilterType.TextBox:
                return {
                    filterType,
                    name: filterName,
                    value: '',
                };
            case FilterType.NumericRange:
                return {
                    filterType,
                    name: filterName,
                    range: {
                        from: undefined,
                        to: undefined,
                    },
                };
            case FilterType.DateRange:
                return {
                    filterType,
                    name: filterName,
                    range: {
                        from: undefined,
                        to: undefined,
                    },
                };
            case FilterType.MultiCheckbox:
                return {
                    filterType,
                    name: filterName,
                    selectedIds: [],
                };
        }
    }

    public static mapToFilterOptions(id: number, uiText: string, selectedIds?: number[]): FilterOption {
        return {
            id,
            uiText,
            isDisplayed: true,
            isSelected: selectedIds?.includes(id) ?? false,
            searchValues: [uiText.toLowerCase(), id.toString()],
        };
    }

    public constructor(public readonly localStorage: CoinageStorageService) {}

    public ngOnInit(): void {
        this.filterValue = TableFilterComponent.createEmptyFilterValue(this.filterType, this.filterName);
        this.filterValue.name = this.filterName;
        if (this.cachedFilterValue && this.cachedFilterValue.length > 0 && this.filterValue.filterType === FilterType.TextBox) {
            this.filterValue.value = this.cachedFilterValue;
        }
        this.lastFilterValue = { ...this.filterValue };

        if (this.isFilterMultiCheckbox && this.filterOptions === undefined) {
            throw new Error('MultiCheckbox Filter must have filterOptions defined.');
        }
    }

    @HostListener('document:mousedown', ['$event'])
    public handleMousedown($event: MouseEvent) {
        if (this.isPopupDisplayed) {
            const target = $event.target as HTMLElement;
            if (!this.tableFilterElement.nativeElement.contains(target)) {
                this.onToggleOpenHide();
            }
        }
    }

    public onToggleOpenHide(): void {
        this.isPopupDisplayed = !this.isPopupDisplayed;
        if (this.isPopupDisplayed) {
            this.autofocus();
            this.openEvent.emit();
        } else {
            this.closeEvent.emit();
        }
    }

    private autofocus(): void {
        setTimeout(() => {
            this.autofocusedFilterInput.first?.nativeElement.focus();
        }, 0);
    }

    public onFilterBlur() {
        if (this.isPopupDisplayed) {
            this.onToggleOpenHide();
        }
        this.focusEvent.emit(false);
    }

    public onPerformFilter(): void {
        switch (this.filterValue.filterType) {
            case FilterType.TextBox:
                this.filterValue.value = this.filterValue.value?.trim();
                break;
            case FilterType.MultiCheckbox:
                this.filterValue.selectedIds = this.filterOptions?.filter((opt) => opt.isSelected).map((opt) => opt.id) ?? [];
                break;
        }
        this.lastFilterValue = { ...this.filterValue };
        this.filterEvent.emit(this.filterValue);
        this.isPopupDisplayed = false;
    }

    public onClear(): void {
        this.filterValue = TableFilterComponent.createEmptyFilterValue(this.filterType, this.filterName);
        this.lastFilterValue = { ...this.filterValue };
        this.filterEvent.emit(this.filterValue);
        this.isPopupDisplayed = false;
        this.onClearOptionsSearchValue();
        this.filterOptions?.forEach((option) => (option.isSelected = false));
    }

    public onCheckVisibleOptions(): void {
        this.filterOptions?.forEach((option) => {
            if (option.isDisplayed) {
                option.isSelected = true;
            }
        });
    }

    public onClearOptionsSearchValue(): void {
        this.onChangeOptionSearchValue('');
    }

    public onChangeOptionSearchValue(value: string) {
        this.optionSearchValue = value;
        this.filterOptions?.forEach(
            (option) => (option.isDisplayed = value.length === 0 || option.searchValues.some((values) => values.includes(value.toLowerCase())))
        );
    }

    public onChangeFilterRangeFrom(): void {
        if (this.filterValue.filterType === FilterType.NumericRange && this.filterValue.range.from !== undefined) {
            if (this.filterValue.range.to === undefined || this.filterValue.range.to < this.filterValue.range.from) {
                this.filterValue.range.to = this.filterValue.range.from ?? 0;
            }
        }
    }

    public onChangeFilterRangeTo(): void {
        if (this.filterValue.filterType === FilterType.NumericRange && this.filterValue.range.to !== undefined) {
            if (this.filterValue.range.from === undefined || this.filterValue.range.from > this.filterValue.range.to) {
                this.filterValue.range.from = this.filterValue.range.to ?? 0;
            }
        }
    }

    public get isFilterApplied(): boolean {
        switch (this.lastFilterValue?.filterType) {
            case FilterType.TextBox:
                return (this.lastFilterValue?.value?.length ?? 0) > 0;
            case FilterType.MultiCheckbox:
                return this.filterOptions?.some((o) => o.isSelected) ?? false;
            case FilterType.DateRange:
                return this.lastFilterValue?.range.from !== undefined || this.lastFilterValue?.range.to !== undefined;
            case FilterType.NumericRange:
                return this.lastFilterValue?.range.from !== undefined || this.lastFilterValue?.range.to !== undefined;
            default:
                throw new Error(`IsFilterApplied not implemented for one or more of FilterTypes.`);
        }
    }

    public get filterIcon(): IconDefinition {
        if (this.isPopupDisplayed) {
            return this.filterOpenIcon;
        }
        return this.isFilterApplied ? this.filterAppliedIcon : this.filterDefaultIcon;
    }

    public get shouldDisplaySearchBox(): boolean {
        return (this.filterOptions?.length ?? 0) > TableFilterComponent.ITEMS_TO_DISPLAY_SEARCH_BOX;
    }

    public get shouldShowCheckVisibleButton(): boolean {
        return (this.filterOptions?.length ?? 0) > TableFilterComponent.ITEMS_TO_DISPLAY_CHECK_ALL_BUTTON;
    }

    public get noOptionDisplayed(): boolean {
        return this.filterOptions?.every((o) => !o.isDisplayed) ?? false;
    }

    public get popupSideClass(): string {
        return this.popupSide === PopupSide.ToLeft ? 'right' : 'left';
    }

    public get filterDataProvided(): boolean {
        return this.datalist.length > 0;
    }

    public get isFilterTextBox(): boolean {
        return this.filterValue.filterType === FilterType.TextBox;
    }

    public get isFilterDateRange(): boolean {
        return this.filterValue.filterType === FilterType.DateRange;
    }

    public get isFilterNumericRange(): boolean {
        return this.filterValue.filterType === FilterType.NumericRange;
    }

    public get isFilterMultiCheckbox(): boolean {
        return this.filterValue.filterType === FilterType.MultiCheckbox;
    }

    public get cacheFilterPath(): string {
        return `${this.cachedFilterPrefix}.${this.filterValue.name}`;
    }
}
