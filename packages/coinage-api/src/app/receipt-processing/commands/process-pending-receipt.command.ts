export class ProcessPendingReceiptCommand {
    public constructor(
        public readonly receiptId: number,
        public readonly imagePath: string,
    ) {}
}
