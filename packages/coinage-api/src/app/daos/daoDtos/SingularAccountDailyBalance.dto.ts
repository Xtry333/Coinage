import { Type } from 'class-transformer';

export class SingularAccountDailyBalance {
    public date!: string;
    public currencySymbol!: string;

    @Type(() => Number)
    public transferCount!: number;

    @Type(() => Number)
    public outcomes!: number;

    @Type(() => Number)
    public incomes!: number;

    @Type(() => Number)
    public balance!: number;
}
