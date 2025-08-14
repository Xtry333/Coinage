import { Component, Input } from '@angular/core';
import { TransferTypeEnum } from '@app/interfaces';

export namespace MoneyAmountComponentData {
    export type TransferData = {
        value: {
            amount: number;
            currency: string;
        };
    };

    export type TransferAccountsData = {
        originAccount: {
            name: string;
            balance: number;
        };
        transferType: string;
        targetAccount: {
            name: string;
            balance: number;
        };
    };
}

@Component({
    selector: 'app-money-amount',
    templateUrl: './money-amount.component.html',
    styleUrls: ['./money-amount.component.scss'],
    standalone: false,
})
export class MoneyAmountComponent {
    @Input() public transferData?: MoneyAmountComponentData.TransferData;
    @Input() public transferAccounts?: MoneyAmountComponentData.TransferAccountsData;

    public get originAccount(): string {
        return this.transferAccounts?.originAccount?.name ?? '';
    }

    public get amount(): number {
        return this.transferData?.value?.amount ?? 0;
    }

    public get currency(): string {
        return this.transferData?.value?.currency ?? '';
    }

    public get targetAccount(): string {
        return this.transferAccounts?.targetAccount?.name ?? '';
    }

    public get showAccounts(): boolean {
        return false;
    }

    public get arrowColor(): string {
        switch (this.transferAccounts?.transferType) {
            case TransferTypeEnum.INCOME:
                return 'incoming';
            case TransferTypeEnum.OUTCOME:
                return 'outgoing';
            case TransferTypeEnum.INTERNAL:
                return 'internal';
        }
        return '';
    }
}
