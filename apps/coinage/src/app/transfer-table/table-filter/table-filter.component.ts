import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { faCaretDown, faEdit, faFilter, IconDefinition } from '@fortawesome/free-solid-svg-icons';

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
    styleUrls: ['./table-filter.component.less'],
})
export class TableFilterComponent implements OnInit {
    public filterDefaultIcon = faCaretDown;
    public filterOpenIcon = faEdit;
    public filterAppliedIcon = faFilter;
    public isPopupDisplayed = false;

    public filterEvent: FilterEvent = {
        value: undefined,
        name: '',
    };
    public lastFilterValue?: FilterEvent;

    @Input()
    public popupSide = 'toRight';
    @Input()
    public filterType = 'textBox';
    @Input()
    public filterName = '';

    @Output()
    public filter = new EventEmitter<FilterEvent>();

    ngOnInit(): void {
        this.filterEvent.name = this.filterName;
    }

    onShowPopup(): void {
        this.isPopupDisplayed = !this.isPopupDisplayed;
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    }

    onDoFilter(): void {
        this.filterEvent.value = this.filterEvent.value?.trim();
        this.lastFilterValue = { ...this.filterEvent };
        this.filter.emit(this.filterEvent);
        this.isPopupDisplayed = false;
    }

    onClear(): void {
        this.filterEvent.value = undefined;
        this.lastFilterValue = { ...this.filterEvent };
        this.filter.emit(this.filterEvent);
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
        return this.filterType === 'textBox';
    }

    get isFilterDateRange(): boolean {
        return this.filterType === 'dateRange';
    }

    get isFilterAmountRange(): boolean {
        return this.filterType === 'amountRange';
    }
}
