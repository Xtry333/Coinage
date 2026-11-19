import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export interface AppliedFilter {
    key: string;
    label: string;
    value?: string;
}

@Component({
    selector: 'app-applied-filters',
    templateUrl: './applied-filters.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
})
export class AppliedFiltersComponent {
    @Input() public filters: AppliedFilter[] = [];

    @Output() public clearAll = new EventEmitter<void>();
    @Output() public remove = new EventEmitter<string>();
}
