import { Component, Input, OnInit } from '@angular/core';
import { TransferDTO } from '@coinage-app/interfaces';

@Component({
    selector: 'coinage-app-transfers-table',
    templateUrl: './transfer-table.component.html',
    styleUrls: ['./transfer-table.component.less'],
})
export class TransferTableComponent implements OnInit {
    @Input()
    tableHeader?: string;

    @Input()
    transfers?: TransferDTO[];

    ngOnInit(): void {}

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
