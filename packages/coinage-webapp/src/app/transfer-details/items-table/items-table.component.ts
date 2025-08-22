import { Component, Input, OnChanges } from '@angular/core';
import { ContainerDTO, TransferItemDTO } from '@app/interfaces';
import { CoinageRoutes } from '../../app-routing/app-routes';

export class UiTransferItemDTO extends TransferItemDTO {
    public constructor(transferItem: TransferItemDTO) {
        super();

        this.id = transferItem.id;
        this.itemName = transferItem.itemName;
        this.unit = transferItem.unit;
        this.unitPrice = transferItem.unitPrice;
        this.amount = transferItem.amount;
        this.totalPrice = transferItem.totalPrice;
        this.setDiscount = transferItem.setDiscount;
        this.containerId = transferItem.containerId;
    }
}

@Component({
    selector: 'app-items-table',
    templateUrl: './items-table.component.html',
    styleUrls: ['./items-table.component.scss'],
    standalone: false,
})
export class ItemsTableComponent implements OnChanges {
    public readonly CoinageRoutes = CoinageRoutes;

    @Input() public items: TransferItemDTO[] = [];
    @Input() public containers: ContainerDTO[] = [];

    public tableItems: UiTransferItemDTO[] = [];
    public totalSum = 0;

    public ngOnChanges(): void {
        this.tableItems = this.items.map((item) => new UiTransferItemDTO(item));
        this.totalSum = this.items.reduce((sum, item) => sum + item.totalPrice - item.setDiscount, 0);
    }

    public idTracker(_index: number, item: TransferItemDTO): string {
        return item.id.toString();
    }

    public getItemLink(item: TransferItemDTO) {
        return CoinageRoutes.TransferItemDetailsPage.getUrl({ id: item.id });
    }

    public get noRowsFound(): boolean {
        return this.tableItems.length === 0;
    }

    public getContainerDetails(containerId: number | null | undefined): string {
        if (!containerId) return '';

        const container = this.containers.find((c) => c.id === containerId);
        if (!container) return '';

        const parts: string[] = [];

        if (container.name) {
            parts.push(container.name);
        }

        if (container.weight && container.weightUnit) {
            parts.push(`${container.weight}${container.weightUnit}`);
        }

        if (container.volume && container.volumeUnit) {
            parts.push(`${container.volume}${container.volumeUnit}`);
        }

        return parts.length > 0 ? ` [${parts.join(', ')}]` : '';
    }
}
