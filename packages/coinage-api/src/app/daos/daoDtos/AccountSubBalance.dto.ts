import { Type } from 'class-transformer';

export class AccountSubBalance {
    public fromAccountId!: number;
    public fromAccountName!: string;
    public toAccountId!: number;
    public toAccountName!: string;

    @Type(() => Number)
    public subBalance!: number;

    public fromUserId!: number;
    public toUserId!: number;

    @Type(() => Boolean)
    public isInternalTransfer!: boolean;
}
