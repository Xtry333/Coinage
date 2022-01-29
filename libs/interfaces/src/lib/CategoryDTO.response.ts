export interface CategoryDTO {
    id: number;
    description?: string | null;
    name: string;
    children?: CategoryDTO[];
    parentId?: number | null;
    systemTag?: string | null;
}
