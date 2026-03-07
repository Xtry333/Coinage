/**
 * Minimal HTTP client for communicating with the coinage-api from the worker.
 */

export interface ApiClientConfig {
    baseUrl: string;
    apiKey?: string;
}

export type WorkerReceiptStatus = 'NONE' | 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'DUPLICATE' | 'ERROR';

export interface PendingReceiptDTO {
    id: number;
    imagePath: string;
    processingStatus: WorkerReceiptStatus;
}

export class ApiClient {
    private readonly config: ApiClientConfig;

    public constructor(config?: Partial<ApiClientConfig>) {
        this.config = {
            baseUrl: config?.baseUrl ?? process.env['COINAGE_API_URL'] ?? 'http://localhost:3000/api',
            apiKey: config?.apiKey ?? process.env['COINAGE_WORKER_API_KEY'],
        };
    }

    public async getPendingReceipts(): Promise<PendingReceiptDTO[]> {
        const res = await this.get('/receipts/pending');
        return res as PendingReceiptDTO[];
    }

    public async updateReceiptStatus(id: number, status: WorkerReceiptStatus, aiData?: object): Promise<void> {
        await this.patch(`/receipts/${id}/worker-status`, { status, aiData });
    }

    private async get(path: string): Promise<unknown> {
        const res = await fetch(`${this.config.baseUrl}${path}`, {
            headers: this.headers(),
        });
        if (!res.ok) throw new Error(`GET ${path} failed: ${res.status} ${await res.text()}`);
        return res.json();
    }

    private async patch(path: string, body: object): Promise<unknown> {
        const res = await fetch(`${this.config.baseUrl}${path}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...this.headers() },
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status} ${await res.text()}`);
        return res.json();
    }

    private headers(): Record<string, string> {
        return this.config.apiKey ? { 'x-worker-api-key': this.config.apiKey } : {};
    }
}
