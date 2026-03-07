import { ApiClient, PendingReceiptDTO } from './api-client';
import { OllamaClient, OllamaExtractedData } from './ollama-client';

const POLL_INTERVAL_MS = parseInt(process.env['WORKER_POLL_INTERVAL_MS'] ?? '10000');

export class ReceiptWorker {
    private readonly api: ApiClient;
    private readonly ollama: OllamaClient;
    private running = false;

    public constructor() {
        this.api = new ApiClient();
        this.ollama = new OllamaClient();
    }

    public async start(): Promise<void> {
        console.log('[receipt-worker] Starting...');
        console.log(`[receipt-worker] Coinage API: ${process.env['COINAGE_API_URL'] ?? 'http://localhost:3000/api'}`);
        console.log(`[receipt-worker] Ollama URL:   ${process.env['OLLAMA_BASE_URL'] ?? 'http://localhost:11434'}`);
        console.log(`[receipt-worker] Ollama model: ${process.env['OLLAMA_MODEL'] ?? 'llava'}`);
        console.log(`[receipt-worker] Poll interval: ${POLL_INTERVAL_MS}ms`);

        const ollamaOk = await this.ollama.isAvailable();
        if (!ollamaOk) {
            console.warn('[receipt-worker] WARNING: Ollama is not reachable. Will retry on each poll cycle.');
        } else {
            console.log('[receipt-worker] Ollama is reachable.');
        }

        this.running = true;
        await this.loop();
    }

    public stop(): void {
        this.running = false;
    }

    private async loop(): Promise<void> {
        while (this.running) {
            try {
                await this.processPending();
            } catch (err) {
                console.error('[receipt-worker] Poll cycle error:', err);
            }
            await this.sleep(POLL_INTERVAL_MS);
        }
    }

    private async processPending(): Promise<void> {
        const pending = await this.api.getPendingReceipts();
        if (pending.length === 0) return;

        console.log(`[receipt-worker] Found ${pending.length} pending receipt(s)`);

        for (const receipt of pending) {
            await this.processReceipt(receipt);
        }
    }

    private async processReceipt(receipt: PendingReceiptDTO): Promise<void> {
        console.log(`[receipt-worker] Processing receipt ${receipt.id}: ${receipt.imagePath}`);

        // Mark as processing
        await this.api.updateReceiptStatus(receipt.id, 'PROCESSING');

        try {
            const aiData = await this.ollama.extractReceiptData(receipt.imagePath);
            console.log(`[receipt-worker] Extracted data for receipt ${receipt.id}:`, JSON.stringify(aiData, null, 2));

            await this.api.updateReceiptStatus(receipt.id, 'PROCESSED', aiData as unknown as object);
            console.log(`[receipt-worker] Receipt ${receipt.id} processed successfully`);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error(`[receipt-worker] Failed to process receipt ${receipt.id}:`, errorMsg);
            await this.api.updateReceiptStatus(receipt.id, 'ERROR');
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
