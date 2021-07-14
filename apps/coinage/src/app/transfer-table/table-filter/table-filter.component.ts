import { Component, EventEmitter, Output } from '@angular/core';
import { faCaretDown, faMarker } from '@fortawesome/free-solid-svg-icons';

export interface FilterEvent {
    value?: string;
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
export class TableFilterComponent {
    public filterIcon = faCaretDown;
    public filterAppliedIcon = faMarker;
    public filterType = 'textBox';
    public isPopupDisplayed = false;

    public filterEvent: FilterEvent = {
        value: undefined,
    };

    @Output()
    public filter = new EventEmitter<FilterEvent>();

    get isFilterTextBox(): boolean {
        return this.filterType === 'textBox';
    }

    onShowPopup(): void {
        this.isPopupDisplayed = !this.isPopupDisplayed;
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    }

    onDoFilter(): void {
        this.filterEvent.value = this.filterEvent.value?.trim();
        this.filter.emit(this.filterEvent);
        this.isPopupDisplayed = false;
    }

    onClear(): void {
        this.filterEvent.value = undefined;
        this.filter.emit(this.filterEvent);
        this.isPopupDisplayed = false;
    }

    get isFilterApplied(): boolean {
        return (this.filterEvent.value?.length ?? 0) > 0;
    }
}
