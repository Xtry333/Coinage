import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { EventsGateway } from '../../../events/events.gateway';
import { ReceiptErrorEvent } from '../receipt-error.event';

@EventsHandler(ReceiptErrorEvent)
export class ReceiptErrorHandler implements IEventHandler<ReceiptErrorEvent> {
    public constructor(private readonly eventsGateway: EventsGateway) {}

    public handle(event: ReceiptErrorEvent): void {
        this.eventsGateway.emitReceiptError(event.receiptId, event.error);
    }
}
