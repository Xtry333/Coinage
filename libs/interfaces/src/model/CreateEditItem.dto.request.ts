export class CreateEditItemDTO {
    public constructor(
        public id: number | null,
        public brand: string | null,
        public name: string,
        public categoryId: number | null,
        public containerSize: number | null,
        public containerSizeUnit: string | null
    ) {}
}
