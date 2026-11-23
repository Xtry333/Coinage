import { IsArray, IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class CreateEditItemDTO {
    public constructor(
        public id: number | null,
        public brand: string | null,
        public name: string,
        public categoryId: number | null,
        containerSize: number | null,
        public containerSizeUnit: string | null,
        tagIds?: number[],
        isArchived?: boolean,
    ) {
        this.containerSize = containerSize;
        this.tagIds = tagIds;
        this.isArchived = isArchived;
    }

    @Min(0)
    @IsOptional()
    public containerSize: number | null;

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Min(1, { each: true })
    public tagIds?: number[];

    @IsOptional()
    @IsBoolean()
    public isArchived?: boolean;
}
