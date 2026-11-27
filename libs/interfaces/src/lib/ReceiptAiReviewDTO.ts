import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export interface NormalizedReceiptItemDTO {
    itemId: number | null;
    isNew: boolean;
    name: string;
    brand: string | null;
    categoryId: number | null;
    price: number;
    quantity: number;
    suggestedContainer: NormalizedContainerDTO | null;
    historicalContainers: NormalizedContainerDTO[];
    containerConfidence: 'auto-single' | 'price-match' | 'dimension-match' | 'none';
    needsContainerConfirmation: boolean;
}

export interface NormalizedContainerDTO {
    packagingId?: number;
    containerId: number | null;
    containerName: string;
    volume: number | null;
    volumeUnit: string | null;
    weight: number | null;
    weightUnit: string | null;
    itemCount: number | null;
    lastUnitPrice: number | null;
}

export interface NormalizedReceiptDTO {
    date?: string | null;
    amount?: number | null;
    contractorId: number | null;
    contractorName: string | null;
    isNewContractor: boolean;
    description?: string | null;
    items: NormalizedReceiptItemDTO[];
}

export interface ReceiptAiResultDTO {
    raw: {
        date?: string | null;
        amount?: number | null;
        contractor?: string | null;
        description?: string | null;
        items?: Array<{ name: string; price: number; quantity?: number }>;
        rawText?: string | null;
        confidence?: number;
    };
    normalized: NormalizedReceiptDTO;
}

export class ConfirmReceiptItemDTO {
    @IsOptional()
    @IsInt()
    @Min(1)
    packagingId?: number | null;

    @IsOptional()
    @IsInt()
    @Min(1)
    itemId!: number | null;

    @IsString()
    name!: string;

    @IsNumber()
    price!: number;

    @IsNumber()
    @Min(0)
    quantity!: number;

    @IsBoolean()
    isNew!: boolean;

    @IsBoolean()
    included!: boolean;
}

export class ConfirmReceiptDTO {
    @IsInt()
    @Min(1)
    originAccountId!: number;

    @IsDateString()
    date!: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    contractorId!: number | null;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ConfirmReceiptItemDTO)
    items!: ConfirmReceiptItemDTO[];
}
