import { Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { ReceiptDao } from '../../../daos/receipt.dao';
import { ReceiptProcessingStatus } from '../../../entities/Receipt.entity';
import { ReceiptErrorEvent } from '../../events/receipt-error.event';
import { ReceiptProcessedEvent } from '../../events/receipt-processed.event';
import { OllamaExtractedData } from '../../services/ollama.service';
import { ReceiptNormalizationService } from '../../services/receipt-normalization.service';
import { MatchExtractedReceiptCommand } from '../match-extracted-receipt.command';

@CommandHandler(MatchExtractedReceiptCommand)
export class MatchExtractedReceiptHandler implements ICommandHandler<MatchExtractedReceiptCommand> {
    private readonly logger = new Logger(MatchExtractedReceiptHandler.name);

    public constructor(
        private readonly receiptDao: ReceiptDao,
        private readonly normalizationService: ReceiptNormalizationService,
        private readonly eventBus: EventBus,
    ) {}

    public async execute(command: MatchExtractedReceiptCommand): Promise<void> {
        const { receiptId } = command;

        const receipt = await this.receiptDao.getById(receiptId);
        const rawData = (receipt.aiExtractedData as { raw: OllamaExtractedData } | null)?.raw;

        if (!rawData) {
            this.logger.error(`Receipt ${receiptId} has no extracted data to match — skipping`);
            await this.receiptDao.updateStatus(receiptId, ReceiptProcessingStatus.ERROR);
            this.eventBus.publish(new ReceiptErrorEvent(receiptId, 'No extracted data available for matching'));
            return;
        }

        this.logger.log(`Matching receipt ${receiptId}`);

        try {
            const normalized = await this.normalizationService.normalize(rawData);
            const matchedCount = normalized.items.filter((i) => !i.isNew).length;
            this.logger.log(
                `Receipt ${receiptId} matched — ${matchedCount}/${normalized.items.length} items matched, contractor ${normalized.isNewContractor ? 'NEW' : 'matched'}`,
            );

            const aiData = { raw: rawData, normalized };
            await this.receiptDao.updateStatus(receiptId, ReceiptProcessingStatus.PROCESSED, aiData as object);
            this.eventBus.publish(new ReceiptProcessedEvent(receiptId, aiData));
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            this.logger.error(`Receipt ${receiptId} matching failed: ${errorMsg}`);
            // Leave as EXTRACTED so the scheduler can retry matching without re-running OCR
            await this.receiptDao.updateStatus(receiptId, ReceiptProcessingStatus.EXTRACTED);
            this.eventBus.publish(new ReceiptErrorEvent(receiptId, errorMsg));
        }
    }
}
