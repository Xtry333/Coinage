export class ItemWithLastUsedPriceDTO {
    public constructor(
        public id: number,
        public name: string,
        public containerSize: number | null,
        public containerSizeUnit: string | null,
        public lastUsedDate: Date | null,
        public lastUnitPrice: number | null,
        public categoryId: number
    ) {}
}
