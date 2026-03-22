import { Logger } from '@nestjs/common';
import { CommandBus, CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { ReceiptDao } from '../../../daos/receipt.dao';
import { ReceiptProcessingStatus } from '../../../entities/Receipt.entity';
import { ReceiptErrorEvent } from '../../events/receipt-error.event';
import { OllamaService } from '../../services/ollama.service';
import { MatchExtractedReceiptCommand } from '../match-extracted-receipt.command';
import { ProcessPendingReceiptCommand } from '../process-pending-receipt.command';

@CommandHandler(ProcessPendingReceiptCommand)
export class ProcessPendingReceiptHandler implements ICommandHandler<ProcessPendingReceiptCommand> {
    private readonly logger = new Logger(ProcessPendingReceiptHandler.name);

    public constructor(
        private readonly receiptDao: ReceiptDao,
        private readonly ollamaService: OllamaService,
        private readonly commandBus: CommandBus,
        private readonly eventBus: EventBus,
    ) {}

    public async execute(command: ProcessPendingReceiptCommand): Promise<void> {
        const { receiptId, imagePath } = command;

        this.logger.log(`OCR processing receipt ${receiptId}`);
        await this.receiptDao.updateStatus(receiptId, ReceiptProcessingStatus.PROCESSING);

        try {
            const rawData = await this.ollamaService.extractReceiptData(imagePath);
            this.logger.log(`Receipt ${receiptId} OCR complete (confidence: ${rawData.confidence ?? 'N/A'}, items: ${rawData.items?.length ?? 0})`);

            await this.receiptDao.updateStatus(receiptId, ReceiptProcessingStatus.EXTRACTED, { raw: rawData });

            // Immediately proceed to matching; scheduler will retry matching if this fails
            await this.commandBus.execute(new MatchExtractedReceiptCommand(receiptId));
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            this.logger.error(`Receipt ${receiptId} OCR failed: ${errorMsg}`);
            const nextStatus = this.isPermanentFailure(err) ? ReceiptProcessingStatus.ERROR : ReceiptProcessingStatus.PENDING;
            await this.receiptDao.updateStatus(receiptId, nextStatus);
            this.eventBus.publish(new ReceiptErrorEvent(receiptId, errorMsg));
        }
    }

    /**
     * Timeouts and connectivity issues are transient — leave as PENDING for retry.
     * Bad image format or model errors are permanent.
     */
    private isPermanentFailure(err: unknown): boolean {
        if (!(err instanceof Error)) return false;
        return err.message.includes('Unsupported image') || err.message.includes('model not found');
    }
}
