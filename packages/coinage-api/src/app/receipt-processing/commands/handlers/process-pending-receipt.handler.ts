import { Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { ReceiptDao } from '../../../daos/receipt.dao';
import { ReceiptProcessingStatus } from '../../../entities/Receipt.entity';
import { ReceiptErrorEvent } from '../../events/receipt-error.event';
import { ReceiptProcessedEvent } from '../../events/receipt-processed.event';
import { OllamaService } from '../../services/ollama.service';
import { ProcessPendingReceiptCommand } from '../process-pending-receipt.command';

@CommandHandler(ProcessPendingReceiptCommand)
export class ProcessPendingReceiptHandler implements ICommandHandler<ProcessPendingReceiptCommand> {
    private readonly logger = new Logger(ProcessPendingReceiptHandler.name);

    public constructor(
        private readonly receiptDao: ReceiptDao,
        private readonly ollamaService: OllamaService,
        private readonly eventBus: EventBus,
    ) {}

    public async execute(command: ProcessPendingReceiptCommand): Promise<void> {
        const { receiptId, imagePath } = command;

        this.logger.log(`Processing receipt ${receiptId}`);
        await this.receiptDao.updateStatus(receiptId, ReceiptProcessingStatus.PROCESSING);

        try {
            const aiData = await this.ollamaService.extractReceiptData(imagePath);
            this.logger.log(`Receipt ${receiptId} extracted successfully (confidence: ${aiData.confidence ?? 'N/A'})`);
            await this.receiptDao.updateStatus(receiptId, ReceiptProcessingStatus.PROCESSED, aiData as object);
            this.eventBus.publish(new ReceiptProcessedEvent(receiptId, aiData));
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            this.logger.error(`Receipt ${receiptId} processing failed: ${errorMsg}`);
            // Revert to PENDING so the scheduler can retry — only permanent failures go to ERROR
            const isPermanentFailure = this.isPermanentFailure(err);
            const nextStatus = isPermanentFailure ? ReceiptProcessingStatus.ERROR : ReceiptProcessingStatus.PENDING;
            await this.receiptDao.updateStatus(receiptId, nextStatus);
            this.eventBus.publish(new ReceiptErrorEvent(receiptId, errorMsg));
        }
    }

    /**
     * Timeouts and connectivity issues are transient — leave as PENDING for retry.
     * Bad image format or Ollama model errors are permanent.
     */
    private isPermanentFailure(err: unknown): boolean {
        if (!(err instanceof Error)) return false;
        return err.message.includes('Unsupported image') || err.message.includes('model not found');
    }
}
