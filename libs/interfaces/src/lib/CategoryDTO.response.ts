export interface CategoryDTO {
    id: number;
    name: string;
    children?: CategoryDTO[];
    parentId?: number | null;
}
