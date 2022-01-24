import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { faCaretDown, faEdit, faFilter, IconDefinition } from '@fortawesome/free-solid-svg-icons';

import { CoinageLocalStorageService } from '../../services/coinage-local-storage.service';

export enum FilterTypes {
    TextBox = 'textBox',
    DateRange = 'dateRange',
    AmountRange = 'amountRange',
}

export enum PopupSides {
    ToRight = 'toRight',
    ToLeft = 'toLeft',
}

export interface OnFilterEvent {
    value?: string;
    name: string;
}

export interface FilterOption {
    id: number;
    uiText: string;
}

@Component({
    selector: 'coinage-app-table-filter',
    templateUrl: './table-filter.component.html',
    styleUrls: ['./table-filter.component.scss'],
})
export class TableFilterComponent implements OnInit {
    public PopupSides = PopupSides;

    public filterDefaultIcon = faCaretDown;
    public filterOpenIcon = faEdit;
    public filterAppliedIcon = faFilter;
    public isPopupDisplayed = false;

    public filterValue: OnFilterEvent = {
        value: undefined,
        name: '',
    };
    public lastFilterValue?: OnFilterEvent;

    @ViewChildren('filterInput')
    private filterInput!: QueryList<ElementRef<HTMLInputElement>>;

    @ViewChild('tableFilterElement')
    private tableFilterElement!: ElementRef<HTMLInputElement>;

    @Input() public popupSide = PopupSides.ToRight;
    @Input() public filterType = FilterTypes.TextBox;
    @Input() public filterName = '';
    @Input() public datalist: string[] = [];
    @Input() public cachedFilterPrefix?: string;
    @Input() public cachedFilterValue?: string;

    @Output() public filterEvent = new EventEmitter<OnFilterEvent>();
    @Output() public openEvent = new EventEmitter<void>();
    @Output() public closeEvent = new EventEmitter<void>();
    @Output() public focusEvent = new EventEmitter<boolean>();

    constructor(public readonly localStorage: CoinageLocalStorageService) {}

    public ngOnInit(): void {
        this.filterValue.name = this.filterName;
        if (this.cachedFilterValue && this.cachedFilterValue.length > 0) {
            this.filterValue.value = this.cachedFilterValue;
            this.lastFilterValue = { ...this.filterValue };
            // this.onPerformFilter();
        }
    }

    @HostListener('document:mousedown', ['$event'])
    handleMousedown($event: MouseEvent) {
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
            this.focus();
            this.openEvent.emit();
        } else {
            this.closeEvent.emit();
        }
    }

    private focus(): void {
        setTimeout(() => {
            this.filterInput.first?.nativeElement.focus();
        }, 0);
    }

    public onFilterBlur() {
        if (this.isPopupDisplayed) {
            this.onToggleOpenHide();
        }
        this.focusEvent.emit(false);
    }

    public onPerformFilter(): void {
        this.filterValue.value = this.filterValue.value?.trim();
        this.lastFilterValue = { ...this.filterValue };
        this.filterEvent.emit(this.filterValue);
        this.isPopupDisplayed = false;
    }

    public onClear(): void {
        this.filterValue.value = undefined;
        this.lastFilterValue = { ...this.filterValue };
        this.filterEvent.emit(this.filterValue);
        this.isPopupDisplayed = false;
    }

    get isFilterApplied(): boolean {
        return (this.lastFilterValue?.value?.length ?? 0) > 0;
    }

    get filterIcon(): IconDefinition {
        if (this.isPopupDisplayed) {
            return this.filterOpenIcon;
        }
        return this.isFilterApplied ? this.filterAppliedIcon : this.filterDefaultIcon;
    }

    get popupSideClass(): string {
        return this.popupSide === PopupSides.ToLeft ? 'right' : 'left';
    }

    get filterDataProvided(): boolean {
        return this.datalist.length > 0;
    }

    get isFilterTextBox(): boolean {
        return this.filterType === FilterTypes.TextBox;
    }

    get isFilterDateRange(): boolean {
        return this.filterType === FilterTypes.DateRange;
    }

    get isFilterAmountRange(): boolean {
        return this.filterType === FilterTypes.AmountRange;
    }

    get cacheFilterPath(): string {
        return `${this.cachedFilterPrefix}.${this.filterValue.name}`;
    }
}
