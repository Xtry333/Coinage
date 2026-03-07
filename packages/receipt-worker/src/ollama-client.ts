import { createReadStream, readFileSync } from 'fs';
import { extname } from 'path';

export interface OllamaConfig {
    baseUrl: string;
    model: string;
    timeout: number;
}

export interface OllamaExtractedData {
    date?: string;
    amount?: number;
    contractor?: string;
    description?: string;
    items?: Array<{ name: string; price: number; quantity?: number }>;
    rawText?: string;
    confidence?: number;
}

const RECEIPT_EXTRACTION_PROMPT = `You are a receipt parsing assistant. Analyze the provided receipt image and extract the following information as JSON:
{
  "date": "YYYY-MM-DD or null",
  "amount": <total amount as number, or null>,
  "contractor": "<store/vendor name or null>",
  "description": "<brief description of purchase or null>",
  "items": [{"name": "<item name>", "price": <price>, "quantity": <qty or 1>}],
  "rawText": "<all text found on receipt>",
  "confidence": <0.0-1.0 confidence score>
}

Return ONLY valid JSON, no markdown, no explanation. If a field cannot be determined, use null.`;

export class OllamaClient {
    private readonly config: OllamaConfig;

    public constructor(config?: Partial<OllamaConfig>) {
        this.config = {
            baseUrl: config?.baseUrl ?? process.env['OLLAMA_BASE_URL'] ?? 'http://localhost:11434',
            model: config?.model ?? process.env['OLLAMA_MODEL'] ?? 'llava',
            timeout: config?.timeout ?? parseInt(process.env['OLLAMA_TIMEOUT'] ?? '120000'),
        };
    }

    public async isAvailable(): Promise<boolean> {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(`${this.config.baseUrl}/api/tags`, { signal: controller.signal });
            clearTimeout(id);
            return res.ok;
        } catch {
            return false;
        }
    }

    public async extractReceiptData(imagePath: string): Promise<OllamaExtractedData> {
        const ext = extname(imagePath).toLowerCase();
        const supportedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

        if (!supportedExts.includes(ext)) {
            throw new Error(`Unsupported image format: ${ext}. Supported: ${supportedExts.join(', ')}`);
        }

        const imageBytes = readFileSync(imagePath);
        const base64Image = imageBytes.toString('base64');
        const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : `image/${ext.slice(1)}`;

        const payload = {
            model: this.config.model,
            prompt: RECEIPT_EXTRACTION_PROMPT,
            images: [base64Image],
            stream: false,
            format: 'json',
        };

        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), this.config.timeout);

        try {
            const response = await fetch(`${this.config.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            clearTimeout(id);

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Ollama API error ${response.status}: ${text}`);
            }

            const result = await response.json() as { response: string };
            return this.parseResponse(result.response);
        } catch (err) {
            clearTimeout(id);
            throw err;
        }
    }

    private parseResponse(raw: string): OllamaExtractedData {
        try {
            // Strip markdown code fences if present
            const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleaned) as OllamaExtractedData;
        } catch {
            // Return minimal structure with raw text if JSON parse fails
            return { rawText: raw, confidence: 0 };
        }
    }
}
