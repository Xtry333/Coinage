import { Transform } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

export interface TagDTO {
    id: number;
    name: string;
    color: string | null;
}

/** A unique effective tag. Both flags can be true without duplicating the tag. */
export interface EffectiveTagDTO extends TagDTO {
    isDirect: boolean;
    isInherited: boolean;
}

export class CreateEditTagDTO {
    @IsOptional()
    @IsInt()
    @Min(1)
    public id?: number;

    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString()
    @IsNotEmpty()
    @MaxLength(64)
    public name!: string;

    @IsOptional()
    @Matches(/^#[0-9a-fA-F]{6}$/)
    public color?: string | null;
}

/** Replaces only stored assignments, never calculated/inherited tags. */
export class SetTagIdsDTO {
    @IsArray()
    @IsInt({ each: true })
    @Min(1, { each: true })
    public tagIds!: number[];
}

export class AssignTagDTO {
    @IsInt()
    @Min(1)
    public tagId!: number;
}
