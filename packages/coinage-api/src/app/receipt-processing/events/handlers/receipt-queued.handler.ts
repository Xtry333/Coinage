import { Logger } from '@nestjs/common';
import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { EventsGateway } from '../../../events/events.gateway';
import { ProcessPendingReceiptCommand } from '../../commands/process-pending-receipt.command';
import { OllamaService } from '../../services/ollama.service';
import { ReceiptQueuedEvent } from '../receipt-queued.event';

@EventsHandler(ReceiptQueuedEvent)
export class ReceiptQueuedHandler implements IEventHandler<ReceiptQueuedEvent> {
    private readonly logger = new Logger(ReceiptQueuedHandler.name);

    public constructor(
        private readonly commandBus: CommandBus,
        private readonly ollamaService: OllamaService,
        private readonly eventsGateway: EventsGateway,
    ) {}

    public async handle(event: ReceiptQueuedEvent): Promise<void> {
        this.eventsGateway.emitReceiptQueued(event.receiptId);

        const available = await this.ollamaService.isAvailable();

        if (!available) {
            this.logger.warn(`Ollama unavailable — receipt ${event.receiptId} stays PENDING for scheduler retry`);
            return;
        }

        this.logger.log(`Ollama available — immediately dispatching receipt ${event.receiptId} for processing`);
        await this.commandBus.execute(new ProcessPendingReceiptCommand(event.receiptId, event.imagePath));
    }
}
