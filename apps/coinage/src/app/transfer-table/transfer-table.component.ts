import { Component, Input, OnInit } from '@angular/core';
import { TransferDTO } from '@coinage-app/interfaces';
import { FilterEvent } from './table-filter/table-filter.component';

@Component({
    selector: 'coinage-app-transfers-table',
    templateUrl: './transfer-table.component.html',
    styleUrls: ['./transfer-table.component.less'],
})
export class TransferTableComponent implements OnInit {
    public static EMPTY_CONTRACTOR = '-';
    private filterCategory?: string;
    private filterContractor?: string;
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

    public transferIdTracker(index: number, item: TransferDTO): string {
        return item.id.toString();
    }

    public onCategoryFilter(ev: FilterEvent) {
        this.filterCategory = ev.value?.toLocaleLowerCase();
        this.doFiltering();
    }

    public onContractorFilter(ev: FilterEvent) {
        this.filterContractor = ev.value?.toLocaleLowerCase();
        this.doFiltering();
    }

    // public isFilteredOut(row: TransferDTO): boolean {
    //     return (
    //         (this.filterCategory !== undefined && !row.category.toLocaleLowerCase().includes(this.filterCategory)) ||
    //         (this.filterContractor !== undefined && !row.contractor?.toLocaleLowerCase().includes(this.filterContractor)) ||
    //         (row.contractor === undefined && this.filterCategory === TransferTableComponent.EMPTY_CONTRACTOR)
    //     );
    // }

    public isDisplayed(row: TransferDTO): boolean {
        return (
            (this.filterCategory === undefined || row.category.toLocaleLowerCase().includes(this.filterCategory)) &&
            (this.filterContractor === undefined ||
                row.contractor?.toLocaleLowerCase().includes(this.filterContractor) ||
                (this.filterContractor === TransferTableComponent.EMPTY_CONTRACTOR && row.contractor === undefined))
        );
    }

    public doFiltering(): void {
        if (this.transfers) {
            this.transfersForTable = this.transfers
                .filter((t) => this.isDisplayed(t))
                .map((t) => {
                    return {
                        ...t,
                        contractor: t.contractor !== undefined ? t.contractor : TransferTableComponent.EMPTY_CONTRACTOR,
                    };
                });
        }
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
        return this.filterCategory !== undefined || this.filterContractor !== undefined;
    }
}
