import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Cron, CronExpression } from '@nestjs/schedule';

import { ReceiptDao } from '../daos/receipt.dao';
import { ReceiptProcessingStatus } from '../entities/Receipt.entity';
import { ProcessPendingReceiptCommand } from './commands/process-pending-receipt.command';
import { OllamaService } from './services/ollama.service';

@Injectable()
export class ReceiptProcessingScheduler implements OnModuleInit {
    private readonly logger = new Logger(ReceiptProcessingScheduler.name);
    private isRunning = false;

    public constructor(
        private readonly receiptDao: ReceiptDao,
        private readonly ollamaService: OllamaService,
        private readonly commandBus: CommandBus,
    ) {}

    public async onModuleInit(): Promise<void> {
        const reset = await this.receiptDao.resetStuckProcessing();
        if (reset > 0) {
            this.logger.warn(`Reset ${reset} receipt(s) stuck in PROCESSING back to PENDING`);
        }
    }

    @Cron(CronExpression.EVERY_30_SECONDS)
    public async retryPendingReceipts(): Promise<void> {
        if (this.isRunning) {
            this.logger.debug('Previous cycle still running, skipping');
            return;
        }

        this.isRunning = true;

        const pending = await this.receiptDao.getPending();
        if (pending.length === 0) {
            this.isRunning = false;
            return;
        }

        this.logger.log(`Found ${pending.length} pending receipt(s), checking AI availability...`);

        const available = await this.ollamaService.isAvailable();
        if (!available) {
            this.logger.warn(`AI not available — ${pending.length} receipt(s) will remain PENDING`);
            this.isRunning = false;
            return;
        }
        this.logger.log(`Ollama available — processing ${pending.length} pending receipt(s)`);

        try {
            for (const receipt of pending) {
                if (!receipt.imagePath) {
                    this.logger.warn(`Receipt ${receipt.id} has no image path, skipping`);
                    continue;
                }
                await this.commandBus.execute(new ProcessPendingReceiptCommand(receipt.id, receipt.imagePath));
            }
        } finally {
            this.isRunning = false;
        }
    }
}
