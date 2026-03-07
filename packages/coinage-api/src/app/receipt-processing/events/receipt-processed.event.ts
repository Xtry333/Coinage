import { OllamaExtractedData } from '../services/ollama.service';

export class ReceiptProcessedEvent {
    public constructor(
        public readonly receiptId: number,
        public readonly aiData: OllamaExtractedData,
    ) {}
}
