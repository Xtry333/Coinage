import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { EventsGateway } from '../../../events/events.gateway';
import { ReceiptProcessedEvent } from '../receipt-processed.event';

@EventsHandler(ReceiptProcessedEvent)
export class ReceiptProcessedHandler implements IEventHandler<ReceiptProcessedEvent> {
    public constructor(private readonly eventsGateway: EventsGateway) {}

    public handle(event: ReceiptProcessedEvent): void {
        this.eventsGateway.emitReceiptProcessed(event.receiptId, event.aiData as object);
    }
}
