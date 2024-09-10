import { Type } from 'class-transformer';

export class AccountMonthlySubChange {
    public changeYear!: number;
    public changeMonth!: number;
    public originAccountId!: number;
    public targetAccountId!: number;

    @Type(() => Number)
    public monthlySubChange!: number;

    @Type(() => Boolean)
    public isInternal!: boolean;

    @Type(() => Number)
    public transferCount!: number;
}
