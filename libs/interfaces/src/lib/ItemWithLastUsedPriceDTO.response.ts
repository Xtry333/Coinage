export class ItemWithLastUsedPriceDTO {
    public constructor(public id: number, public name: string, public lastUsedDate: Date | null, public lastUnitPrice: number | null) {}
}
