import { IsArray, IsInt, IsOptional, Min } from 'class-validator';

export class CreateEditItemDTO {
    public constructor(
        public id: number | null,
        public brand: string | null,
        public name: string,
        public categoryId: number,
        containerSize: number | null,
        public containerSizeUnit: string | null,
        tagIds?: number[],
    ) {
        this.containerSize = containerSize;
        this.tagIds = tagIds;
    }

    @Min(0)
    @IsOptional()
    public containerSize: number | null;

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Min(1, { each: true })
    public tagIds?: number[];
}
