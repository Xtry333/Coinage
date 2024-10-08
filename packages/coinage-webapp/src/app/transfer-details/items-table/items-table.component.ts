import { Component, Input, OnChanges } from '@angular/core';
import { TransferItemDTO } from '@coinage-app/interfaces';
import { CoinageRoutes } from '../../app-routing/app-routes';

export class UiTransferItemDTO extends TransferItemDTO {
    public totalPrice: number;

    public constructor(transferItem: TransferItemDTO) {
        super();

        this.id = transferItem.id;
        this.itemName = transferItem.itemName;
        this.unit = transferItem.unit;
        this.unitPrice = transferItem.unitPrice;
        this.amount = transferItem.amount;
        this.totalPrice = transferItem.amount * transferItem.unitPrice;
    }
}

@Component({
    selector: 'app-items-table',
    templateUrl: './items-table.component.html',
    styleUrls: ['./items-table.component.scss'],
})
export class ItemsTableComponent implements OnChanges {
    public readonly CoinageRoutes = CoinageRoutes;

    @Input() public items: TransferItemDTO[] = [];

    public tableItems: UiTransferItemDTO[] = [];
    public totalSum = 0;

    public ngOnChanges(): void {
        this.tableItems = [];
        this.items.forEach((item) => {
            this.tableItems.push(new UiTransferItemDTO(item));
            this.totalSum = this.totalSum + item.amount * item.unitPrice;
        });
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
}
