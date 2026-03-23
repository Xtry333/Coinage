export class ReceiptQueuedEvent {
    public constructor(
        public readonly receiptId: number,
        public readonly imagePath: string,
    ) {}
}
