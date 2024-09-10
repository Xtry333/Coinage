import { IsOptional, Min } from 'class-validator';

export class CreateEditItemDTO {
    public constructor(
        public id: number | null,
        public brand: string | null,
        public name: string,
        public categoryId: number,
        containerSize: number | null,
        public containerSizeUnit: string | null,
    ) {
        this.containerSize = containerSize;
    }

    @Min(0)
    @IsOptional()
    public containerSize: number | null;
}
