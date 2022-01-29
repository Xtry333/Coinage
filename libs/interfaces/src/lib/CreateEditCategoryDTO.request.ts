export interface CreateEditCategoryDTO {
    id?: number;
    name: string;
    description?: string | null;
    parentId?: number;
}
