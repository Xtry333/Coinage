import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class GlobalSearchRequest {
    @IsString()
    @IsNotEmpty()
    public query: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(50)
    public itemsLimit?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(50)
    public transfersLimit?: number;

    public constructor(query: string, itemsLimit?: number, transfersLimit?: number) {
        this.query = query;
        this.itemsLimit = itemsLimit;
        this.transfersLimit = transfersLimit;
    }
}
