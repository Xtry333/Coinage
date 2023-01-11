import { Component, Input, OnChanges, OnInit } from '@angular/core';

import { IconDefinition, faReceipt } from '@fortawesome/free-solid-svg-icons';
import { TransferDTO, TransferItemDTO, TransferWithItemDetailsDTO } from '@coinage-app/interfaces';

import { CoinageDataService } from '../../services/coinage.data-service';
import { CoinageLocalStorageService } from '../../services/coinage-local-storage.service';
import { NavigatorPages } from '../../services/navigator.service';

export enum TableColumn {
    Transfer = 'Transfer',
    Contractor = 'Contractor',
    UnitPrice = 'Unit Price',
    Quantity = 'Quantity',
    Account = 'Account',
    Date = 'Date',
}

@Component({
    selector: 'app-transfer-items-table',
    templateUrl: './transfer-items-table.component.html',
    styleUrls: ['./transfer-items-table.component.scss'],
})
export class TransferItemsTableComponent {
    public static readonly EMPTY_CONTRACTOR = '−';
    public static readonly EMPTY_DESCRIPTION = '−';

    public readonly EMPTY_CONTRACTOR = TransferItemsTableComponent.EMPTY_CONTRACTOR;
    public readonly TableColumn = TableColumn;
    public readonly NavigatorPages = NavigatorPages;

    public receiptIcon: IconDefinition = faReceipt;

    public outcomesSum = 0;
    public outcomesCount = 0;
    public incomesSum = 0;
    public incomesCount = 0;

    @Input() public header?: string;
    @Input() public transfersWithItem: TransferWithItemDetailsDTO[] = [];
    @Input() public showFilters?: boolean = false;
    @Input() public showSummary?: boolean = true;
    @Input() public showReceiptIcon?: boolean = true;
    @Input() public showTodayMarker?: boolean = true;
    @Input() public filterCachePath?: string;
    @Input() public lastPageNumber?: number;

    public constructor(private readonly dataService: CoinageDataService, private readonly localStorage: CoinageLocalStorageService) {}

    public transferWithItemIdTracker(_index: number, item: TransferWithItemDetailsDTO): string {
        return item.transferId.toString() + item.unitPrice.toString();
    }

    public get isHeaderDisplayed(): boolean {
        return this.header !== undefined;
    }

    public get hasAnyRows(): boolean {
        return this.transfersWithItem.length > 0;
    }

    public get totalQuantity(): number {
        return this.transfersWithItem.reduce((acc, transferItem) => (acc += transferItem.quantity), 0);
    }

    public get totalPrice(): number {
        return this.transfersWithItem.reduce((acc, transferItem) => (acc += transferItem.quantity * transferItem.unitPrice), 0);
    }
}
