import { Component, Input } from '@angular/core';
import { TransferDTO } from '@coinage-app/interfaces';

@Component({
    selector: 'coinage-app-transfers-table',
    templateUrl: './transfer-table.component.html',
    styleUrls: ['./transfer-table.component.less'],
})
export class TransferTableComponent {
    @Input()
    tableHeader?: string;

    @Input()
    transfers?: TransferDTO[];

    @Input()
    showFilters?: boolean = false;

    public transferIdTracker(index: number, item: TransferDTO): string {
        return item.id.toString();
    }

    get isHeaderDisplayed(): boolean {
        return this.tableHeader !== undefined;
    }

    get noRowsFound(): boolean {
        return !(this.transfers && this.transfers.length > 0);
    }
}
