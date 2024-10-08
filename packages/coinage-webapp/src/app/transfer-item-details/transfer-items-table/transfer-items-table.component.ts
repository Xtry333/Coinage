import { Component, Input, OnChanges, OnInit } from '@angular/core';

import { IconDefinition, faReceipt } from '@fortawesome/free-solid-svg-icons';
import { ItemDetailsDTO, TransferDTO, TransferItemDTO, TransferWithItemDetailsDTO } from '@coinage-app/interfaces';

import { CoinageDataService } from '../../services/coinage.data-service';
import { CoinageStorageService } from '../../core/services/storage-service/coinage-storage.service';
import { CoinageRoutes } from '../../app-routing/app-routes';

export enum TableColumn {
    Transfer = 'Transfer',
    Contractor = 'Contractor',
    UnitPrice = 'Unit Price',
    StandardPrice = 'StandardPrice',
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
    public readonly CoinageRoutes = CoinageRoutes;

    public receiptIcon: IconDefinition = faReceipt;

    public outcomesSum = 0;
    public outcomesCount = 0;
    public incomesSum = 0;
    public incomesCount = 0;

    @Input() public header?: string;
    @Input() public transfersWithItem: TransferWithItemDetailsDTO[] = [];
    @Input() public item?: ItemDetailsDTO;
    @Input() public showFilters?: boolean = false;
    @Input() public showSummary?: boolean = true;
    @Input() public showReceiptIcon?: boolean = true;
    @Input() public showTodayMarker?: boolean = true;
    @Input() public filterCachePath?: string;
    @Input() public lastPageNumber?: number;

    public constructor(
        private readonly dataService: CoinageDataService,
        private readonly localStorage: CoinageStorageService,
    ) {}

    public transferWithItemIdTracker(_index: number, item: TransferWithItemDetailsDTO): string {
        return item.transferId.toString() + item.unitPrice.toString();
    }

    public getStandardPrice(details: TransferWithItemDetailsDTO): string {
        const standardPrice = details.unitPrice / (this.item?.container?.size ?? 1);
        return `${standardPrice.toFixed(3)} zł/${this.item?.container?.unit}`;
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

    public get totalItems(): number {
        return this.transfersWithItem.length;
    }

    public get totalPrice(): number {
        return this.transfersWithItem.reduce((acc, transferItem) => (acc += transferItem.quantity * transferItem.unitPrice), 0);
    }
}
