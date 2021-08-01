import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { faCaretDown, faEdit, faFilter, IconDefinition } from '@fortawesome/free-solid-svg-icons';

export enum FilterTypes {
    TextBox = 'textBox',
    DateRange = 'dateRange',
    AmountRange = 'amountRange',
}

export enum PopupSides {
    ToRight = 'toRight',
    ToLeft = 'toLeft',
}

export interface FilterEvent {
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
    public filterDefaultIcon = faCaretDown;
    public filterOpenIcon = faEdit;
    public filterAppliedIcon = faFilter;
    public isPopupDisplayed = false;

    public filterValue: FilterEvent = {
        value: undefined,
        name: '',
    };
    public lastFilterValue?: FilterEvent;

    @ViewChildren('filterInput')
    private filterInput!: QueryList<ElementRef<HTMLInputElement>>;

    @ViewChild('tableFilterElement')
    private tableFilterElement!: ElementRef<HTMLInputElement>;

    @Input()
    public popupSide = PopupSides.ToRight;

    @Input()
    public filterType = FilterTypes.TextBox;

    @Input()
    public filterName = '';

    @Output()
    public filterEvent = new EventEmitter<FilterEvent>();

    @Output()
    public openEvent = new EventEmitter<void>();

    @Output()
    public closeEvent = new EventEmitter<void>();

    @Output()
    public focusEvent = new EventEmitter<boolean>();

    public ngOnInit(): void {
        this.filterValue.name = this.filterName;
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

    public onDoFilter(): void {
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

    get isFilterTextBox(): boolean {
        return this.filterType === FilterTypes.TextBox;
    }

    get isFilterDateRange(): boolean {
        return this.filterType === FilterTypes.DateRange;
    }

    get isFilterAmountRange(): boolean {
        return this.filterType === FilterTypes.AmountRange;
    }
}
