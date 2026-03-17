export interface TagDTO {
    id: number;
    name: string;
    color: string | null;
}

export interface CreateEditTagDTO {
    id?: number;
    name: string;
    color?: string;
}
