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
    containerId: number;
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

export interface ConfirmReceiptItemDTO {
    itemId: number | null;
    name: string;
    price: number;
    quantity: number;
    isNew: boolean;
    included: boolean;
}

export interface ConfirmReceiptDTO {
    accountId: number;
    date: string;
    contractorId: number | null;
    items: ConfirmReceiptItemDTO[];
}
