import { OllamaExtractedData } from '../services/ollama.service';
import { NormalizedReceiptData } from '../services/receipt-normalization.service';

export interface ProcessedReceiptData {
    raw: OllamaExtractedData;
    normalized: NormalizedReceiptData;
}

export class ReceiptProcessedEvent {
    public constructor(
        public readonly receiptId: number,
        public readonly aiData: ProcessedReceiptData,
    ) {}
}
