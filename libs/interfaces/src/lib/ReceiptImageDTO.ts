export enum ReceiptProcessingStatus {
    NONE = 'NONE',
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    PROCESSED = 'PROCESSED',
    DUPLICATE = 'DUPLICATE',
    ERROR = 'ERROR',
}

export interface ReceiptUploadResponseDTO {
    receiptId: number;
    isDuplicate: boolean;
    duplicateOfReceiptId?: number;
    status: ReceiptProcessingStatus;
}

export interface ReceiptPendingDTO {
    id: number;
    imagePath: string;
    processingStatus: ReceiptProcessingStatus;
    uploadedAt?: string;
}

export interface ReceiptAiExtractedData {
    date?: string;
    amount?: number;
    contractor?: string;
    description?: string;
    items?: Array<{ name: string; price: number; quantity?: number }>;
    rawText?: string;
    confidence?: number;
}
