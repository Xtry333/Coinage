import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TransferDTO, TransferType, TransferTypeEnum } from '@coinage-app/interfaces';
import { faReceipt, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import * as Rx from 'rxjs';

import { CoinageLocalStorageService } from '../services/coinage-local-storage.service';
import { CoinageDataService } from '../services/coinageData.service';
import { NavigatorPages } from '../services/navigator.service';
import {
    FilterOption,
    FilterType,
    OnDateRangeFilterEvent,
    OnFilterEvent,
    OnMultiCheckboxFilterEvent,
    OnNumericRangeFilterEvent,
    OnTextBoxFilterEvent,
    PopupSide as PopupSide,
    TableFilterComponent,
} from './table-filter/table-filter.component';

export enum TableColumn {
    Category = 'Category',
    Description = 'Description',
    Contractor = 'Contractor',
    Amount = 'Amount',
    Date = 'Date',
    Account = 'Account',
}

export const TableColumnsFilterTypes: Record<TableColumn, FilterType> & { [key: string]: FilterType } = {
    Category: FilterType.MultiCheckbox,
    Description: FilterType.TextBox,
    Contractor: FilterType.MultiCheckbox,
    Account: FilterType.MultiCheckbox,
    Amount: FilterType.NumericRange,
    Date: FilterType.DateRange,
};

export type OptionsForCheckboxFilters = {
    categories: FilterOption[];
    contractors: FilterOption[];
    accounts: FilterOption[];
};

export interface TableFilterFields {
    categoryIds?: number[];
    contractorIds?: number[];
    category?: string;
    description?: string;
    contractor?: string;
    account?: string;
    amountFrom?: number;
    amountTo?: number;
    dateFrom?: Date;
    dateTo?: Date;
    showPlanned?: boolean;
    [key: string]: Date | string | boolean | number | number[] | undefined;
}

export type UiTransfer = TransferDTO & { typeSymbol: string; isTodayMarkerRow?: boolean };

@Component({
    selector: 'coinage-app-transfers-table',
    templateUrl: './transfers-table.component.html',
    styleUrls: ['./transfers-table.component.scss'],
})
export class TransfersTableComponent implements OnInit, OnChanges {
    public static EMPTY_CONTRACTOR = '-';
    public static EMPTY_DESCRIPTION = '-';

    public readonly FilterType = FilterType;
    public readonly PopupSide = PopupSide;
    public readonly TableColumn = TableColumn;
    public readonly NavigatorPages = NavigatorPages;

    public receiptIcon: IconDefinition = faReceipt;

    public filter: TableFilterFields = {};
    public outcomesSum = 0;
    public outcomesCount = 0;
    public incomesSum = 0;
    public incomesCount = 0;

    public transfersForTable: UiTransfer[] = [];
    public optionsForCheckboxFilters: OptionsForCheckboxFilters = {
        categories: [],
        accounts: [],
        contractors: [],
    };

    currentPage = 1;

    @Input() tableHeader?: string;
    @Input() transfers?: TransferDTO[];
    @Input() showFilters?: boolean = false;
    @Input() showSummary?: boolean = true;
    @Input() showReceiptIcon?: boolean = true;
    @Input() showTodayMarker?: boolean = true;
    @Input() filterCachePath?: string;
    @Input() lastPageNumber?: number;

    @Output() public tableFilterEvent = new EventEmitter<TableFilterFields>();

    constructor(private route: ActivatedRoute, private readonly dataService: CoinageDataService, private readonly localStorage: CoinageLocalStorageService) {}

    public ngOnInit(): void {
        if (this.showFilters) {
            Rx.zip(this.dataService.getCategoryList(), this.dataService.getContractorList(), this.dataService.getAllAvailableAccounts()).subscribe(
                ([categories, contractors, accounts]) => {
                    this.optionsForCheckboxFilters.categories = categories.map((c) => TableFilterComponent.mapToFilterOptions(c.id, c.name));
                    this.optionsForCheckboxFilters.contractors = contractors.map((c) => TableFilterComponent.mapToFilterOptions(c.id, c.name));
                    this.optionsForCheckboxFilters.accounts = accounts.map((a) => TableFilterComponent.mapToFilterOptions(a.id, a.name));
                }
            );
            if (this.filterCachePath) {
                const cachedFilters = this.localStorage.getObject<TableFilterFields>(this.filterCachePath);
                if (cachedFilters) {
                    this.filter = cachedFilters;
                }
            }
        }

        this.doFiltering();
    }

    public ngOnChanges(): void {
        this.doFiltering();
    }

    public transferIdTracker(index: number, item: TransferDTO): string {
        return item.id.toString();
    }

    public onPerformFilter(event: OnFilterEvent) {
        if (this.checkFilterEventColumnName<OnTextBoxFilterEvent>(event, TableColumn.Description)) {
            this.filter.description = event.value;
        } else if (this.checkFilterEventColumnName<OnMultiCheckboxFilterEvent>(event, TableColumn.Category)) {
            this.filter.categoryIds = event.selectedIds;
        } else if (this.checkFilterEventColumnName<OnMultiCheckboxFilterEvent>(event, TableColumn.Contractor)) {
            this.filter.contractorIds = event.selectedIds;
        } else if (this.checkFilterEventColumnName<OnMultiCheckboxFilterEvent>(event, TableColumn.Account)) {
            this.filter.accountIds = event.selectedIds;
        } else if (this.checkFilterEventColumnName<OnNumericRangeFilterEvent>(event, TableColumn.Amount)) {
            this.filter.amountFrom = event.range.from;
            this.filter.amountTo = event.range.to;
        } else if (this.checkFilterEventColumnName<OnDateRangeFilterEvent>(event, TableColumn.Date)) {
            this.filter.dateFrom = event.range.from;
            this.filter.dateTo = event.range.to;
        } else {
            throw new Error(`Expected ${TableColumnsFilterTypes[event.name]} for ${event.name} column but received ${event.filterType} OnFilterEvent. `);
        }

        if (this.filterCachePath) {
            this.localStorage.setObject(this.filterCachePath, this.filter);
        }
        this.currentPage = 1;
        this.tableFilterEvent.emit(this.filter);
        this.doFiltering();
    }

    private checkFilterEventColumnName<T extends OnFilterEvent>(event: OnFilterEvent, tableColumn: TableColumn): event is T & boolean {
        return event.filterType === TableColumnsFilterTypes[tableColumn] && event.name === tableColumn;
    }

    public isDisplayed(row: TransferDTO): boolean {
        return (
            (this.filter.category === undefined || this.caseInsensitiveIncludes(row.categoryName, this.filter.category)) &&
            (this.filter.description === undefined || this.caseInsensitiveIncludes(row.description, this.filter.description)) &&
            (this.filter.account === undefined || this.caseInsensitiveIncludes(row.accountName, this.filter.account)) &&
            (this.filter.contractor === undefined ||
                this.caseInsensitiveIncludes(row.contractorName ?? TransfersTableComponent.EMPTY_CONTRACTOR, this.filter.contractor)) &&
            (this.filter.showPlanned || new Date(row.date) < new Date())
        );
    }

    public doFiltering(): void {
        this.outcomesSum = 0;
        this.outcomesCount = 0;
        this.incomesSum = 0;
        this.incomesCount = 0;
        if (this.transfers) {
            this.transfersForTable = this.transfers
                //.filter((t) => !this.showFilters || this.isDisplayed(t))
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
                        //contractor: t.contractor !== undefined ? t.contractor : TransfersTableComponent.EMPTY_CONTRACTOR,
                    };
                });
        }
        if (this.showTodayMarker) {
            this.placeTodayMarkerRow();
        }
    }

    private placeTodayMarkerRow(): void {
        const todayStr = new Date().toISOString().substring(0, 10);
        const todayTransfersIndex = this.transfersForTable.findIndex((t) => t.date.localeCompare(todayStr) <= 0);
        if (todayTransfersIndex != -1) {
            this.transfersForTable.splice(todayTransfersIndex, 0, this.dummyTransfer, this.dummyTransfer);
        } else {
            this.transfersForTable.push(this.dummyTransfer, this.dummyTransfer);
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

    public showAllChecked(value: boolean) {
        this.filter.showPlanned = value;
        if (this.filterCachePath) {
            this.localStorage.setObject(this.filterCachePath, this.filter);
        }
        this.tableFilterEvent.emit(this.filter);
        this.doFiltering();
    }

    get isAnyFilterApplied(): boolean {
        for (const key in this.filter) {
            if (this.filter[key] !== undefined) {
                return true;
            }
        }
        return false;
    }

    get dummyTransfer(): UiTransfer {
        return {
            id: -1,
            date: '',
            type: TransferTypeEnum.OUTCOME,
            accountId: 0,
            accountName: '',
            categoryId: 0,
            contractorName: null,
            contractorId: null,
            amount: 0,
            categoryName: '',
            description: '',
            receiptId: 0,
            typeSymbol: TransferType.OUTCOME.symbol,
            isTodayMarkerRow: true,
        };
    }
}
