import { Component, Input, OnChanges, OnInit } from '@angular/core';
import * as Rx from 'rxjs';
import { TransferDTO, TransferType, TransferTypeEnum } from '@coinage-app/interfaces';
import { CoinageDataService } from '../services/coinageData.service';
import { FilterEvent, FilterTypes, PopupSides } from './table-filter/table-filter.component';

export enum TableColumns {
    Category = 'category',
    Description = 'description',
    Contractor = 'contractor',
    Amount = 'amount',
    Date = 'date',
}

export interface TableFilterFields {
    category?: string;
    description?: string;
    contractor?: string;
    [key: string]: string | undefined;
}

@Component({
    selector: 'coinage-app-transfers-table',
    templateUrl: './transfers-table.component.html',
    styleUrls: ['./transfers-table.component.scss'],
})
export class TransfersTableComponent implements OnInit, OnChanges {
    public static EMPTY_CONTRACTOR = '-';
    public static EMPTY_DESCRIPTION = '-';

    public FilterTypes = FilterTypes;
    public PopupSides = PopupSides;
    public TableColumns = TableColumns;

    private filter: TableFilterFields = { category: '', contractor: '', description: '' };
    public outcomesSum = 0;
    public outcomesCount = 0;
    public incomesSum = 0;
    public incomesCount = 0;

    public transfersForTable: (TransferDTO & { typeSymbol: string })[] = [];
    public categoryNames: string[] = [];
    public contractorNames: string[] = [];

    @Input() tableHeader?: string;
    @Input() transfers?: TransferDTO[];
    @Input() showFilters?: boolean = false;

    constructor(private readonly dataService: CoinageDataService) {}

    public ngOnInit(): void {
        this.doFiltering();

        if (this.showFilters) {
            Rx.zip(this.dataService.getCategoryList(), this.dataService.getContractorList()).subscribe(([categories, contractors]) => {
                this.categoryNames = categories.map((c) => c.name);
                this.contractorNames = contractors.map((c) => c.name);
            });
        }
    }

    public ngOnChanges(): void {
        this.doFiltering();
    }

    public transferIdTracker(index: number, item: TransferDTO): string {
        return item.id.toString();
    }

    public onFilter(ev: FilterEvent) {
        this.filter[ev.name] = ev.value;
        // Replaced by simpler code above
        // switch (ev.name) {
        //     case TableColumns.Category:
        //         this.filter.category = ev.value;
        //         break;
        //     case TableColumns.Description:
        //         this.filter.description = ev.value;
        //         break;
        //     case TableColumns.Contractor:
        //         this.filter.contractor = ev.value;
        //         break;
        // }
        this.doFiltering();
    }

    public isDisplayed(row: TransferDTO): boolean {
        return (
            (this.filter.category === undefined || this.caseInsensitiveIncludes(row.category, this.filter.category)) &&
            (this.filter.description === undefined || this.caseInsensitiveIncludes(row.description, this.filter.description)) &&
            (this.filter.contractor === undefined ||
                this.caseInsensitiveIncludes(row.contractor ?? TransfersTableComponent.EMPTY_CONTRACTOR, this.filter.contractor))
        );
    }

    public doFiltering(): void {
        this.outcomesSum = 0;
        this.outcomesCount = 0;
        this.incomesSum = 0;
        this.incomesCount = 0;
        if (this.transfers) {
            this.transfersForTable = this.transfers
                .filter((t) => this.isDisplayed(t))
                .map((t) => {
                    if (t.type === 'OUTCOME') {
                        this.outcomesSum += t.amount;
                        this.outcomesCount++;
                    } else {
                        this.incomesSum += t.amount;
                        this.incomesCount++;
                    }
                    return {
                        ...t,
                        typeSymbol: TransferType[t.type].symbol,
                        contractor: t.contractor !== undefined ? t.contractor : TransfersTableComponent.EMPTY_CONTRACTOR,
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
