import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { TransferDTO } from '@coinage-app/interfaces';
import { FilterEvent } from './table-filter/table-filter.component';

export interface TableFilterFields {
    category?: string;
    description?: string;
    contractor?: string;
    [key: string]: string | undefined;
}

@Component({
    selector: 'coinage-app-transfers-table',
    templateUrl: './transfer-table.component.html',
    styleUrls: ['./transfer-table.component.less'],
})
export class TransferTableComponent implements OnInit, OnChanges {
    public static EMPTY_CONTRACTOR = '-';
    public static EMPTY_DESCRIPTION = '-';

    private filter: TableFilterFields = { category: '', contractor: '', description: '' };
    public outcomesSum = 0;

    @Input()
    tableHeader?: string;
    @Input()
    transfers?: TransferDTO[];

    transfersForTable: TransferDTO[] = [];

    @Input()
    showFilters?: boolean = false;

    public ngOnInit(): void {
        this.doFiltering();
    }

    public ngOnChanges(): void {
        this.doFiltering();
    }

    public transferIdTracker(index: number, item: TransferDTO): string {
        return item.id.toString();
    }

    public onFilter(ev: FilterEvent) {
        switch (ev.name) {
            case 'category':
                this.filter.category = ev.value;
                break;
            case 'description':
                this.filter.description = ev.value;
                break;
            case 'contractor':
                this.filter.contractor = ev.value;
                break;
        }
        this.doFiltering();
    }

    public isDisplayed(row: TransferDTO): boolean {
        return (
            (this.filter.category === undefined || this.caseInsensitiveIncludes(row.category, this.filter.category)) &&
            (this.filter.description === undefined || this.caseInsensitiveIncludes(row.description, this.filter.description)) &&
            (this.filter.contractor === undefined ||
                this.caseInsensitiveIncludes(row.contractor ?? TransferTableComponent.EMPTY_CONTRACTOR, this.filter.contractor))
        );
    }

    public doFiltering(): void {
        this.outcomesSum = 0;
        if (this.transfers) {
            this.transfersForTable = this.transfers
                .filter((t) => this.isDisplayed(t))
                .map((t) => {
                    if (t.type === 'OUTCOME') {
                        this.outcomesSum += t.amount;
                    }
                    return {
                        ...t,
                        contractor: t.contractor !== undefined ? t.contractor : TransferTableComponent.EMPTY_CONTRACTOR,
                    };
                });
        }
    }

    private caseInsensitiveIncludes(a: string, b: string) {
        return a.toLocaleLowerCase().includes(b.toLocaleLowerCase());
    }

    get isHeaderDisplayed(): boolean {
        return this.tableHeader !== undefined;
    }

    get noRowsFound(): boolean {
        return this.transfersForTable.length === 0;
    }

    get noRows(): boolean {
        return this.transfers?.length === 0;
    }

    get isAnyFilterApplied(): boolean {
        for (const key in this.filter) {
            if (this.filter[key] != undefined) {
                return true;
            }
        }
        return false;
    }
}
