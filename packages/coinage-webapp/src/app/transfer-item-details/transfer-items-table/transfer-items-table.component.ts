import { Component, Input, OnChanges, OnInit } from '@angular/core';

import { IconDefinition, faReceipt } from '@fortawesome/free-solid-svg-icons';
import { ItemDetailsDTO, TransferDTO, TransferItemDTO, TransferWithItemDetailsDTO } from '@app/interfaces';

import { CoinageDataService } from '../../services/coinage.data-service';
import { CoinageStorageService } from '../../core/services/storage-service/coinage-storage.service';
import { CoinageRoutes } from '../../app-routing/app-routes';
import { toLiters, toKg, Unit } from '@app/common-units';

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
    standalone: false,
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
        const parts = [item.transferId?.toString() ?? '', item.unitPrice?.toString() ?? ''];
    if (item.containerName) parts.push(item.containerName ?? '');
        return parts.join('|');
    }

    public formatContainer(details: TransferWithItemDetailsDTO): string {
    const name = details.containerName ?? null;
    const weight = details.containerWeight ?? null;
    const weightUnit = details.containerWeightUnit ?? null;
    const volume = details.containerVolume ?? null;
    const volumeUnit = details.containerVolumeUnit ?? null;

        if (!name && !weight && !volume) return TransferItemsTableComponent.EMPTY_DESCRIPTION;

        const pieces: string[] = [];
        if (name) pieces.push(name);
        if (weight) pieces.push(`${weight}${weightUnit ? ' ' + weightUnit : ''}`);
        if (volume) pieces.push(`${volume}${volumeUnit ? ' ' + volumeUnit : ''}`);

        return pieces.join(' · ');
    }

    public getStandardPrice(details: TransferWithItemDetailsDTO): string {
    // Compute standardized prices per L and per KG where possible using shared Unit enum.
    let volumeSize = details.containerVolume ?? null;
    let volumeUnit: Unit | null = details.containerVolumeUnit ?? null;
    let weightSize = details.containerWeight ?? null;
    let weightUnit: Unit | null = details.containerWeightUnit ?? null;

        // fallback to deprecated item-level container
        if ((!volumeSize && !weightSize) && this.item?.container) {
            const u = this.item.container.unit ?? null;
            const s = this.item.container.size ?? null;
            if (s && u) {
                if (u === Unit.ML || u === Unit.L || u === Unit.CL) {
                    volumeSize = s;
                    volumeUnit = u;
                } else if (u === Unit.G || u === Unit.KG) {
                    weightSize = s;
                    weightUnit = u;
                }
            }
        }

        const parts: string[] = [];

        if (volumeSize && volumeUnit) {
            const liters = toLiters(volumeSize, volumeUnit);
            if (liters && liters > 0) parts.push(`${(details.unitPrice / liters).toFixed(3)} zł/L`);
        }

        if (weightSize && weightUnit) {
            const kgs = toKg(weightSize, weightUnit);
            if (kgs && kgs > 0) parts.push(`${(details.unitPrice / kgs).toFixed(3)} zł/kg`);
        }

    if (parts.length > 0) return parts.join(' · ');

    // fallback to raw container unit if nothing else
    const fallbackUnit = (this.item?.container?.unit ?? details.containerVolumeUnit ?? details.containerWeightUnit) ?? null;
    const fallbackSize = this.item?.container?.size ?? (details.containerVolume ?? details.containerWeight ?? 1);
    const eff = fallbackSize && fallbackSize > 0 ? fallbackSize : 1;
    const fallbackLabel = fallbackUnit ? fallbackUnit : '';
    return `${(details.unitPrice / eff).toFixed(3)} zł/${fallbackLabel}`;
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
