export class ReceiptErrorEvent {
    public constructor(
        public readonly receiptId: number,
        public readonly error: string,
    ) {}
}
