/** Item classification is reference data, not a PostgreSQL enum or a pricing restriction. */
export interface ItemKindDTO {
    code: string;
    name: string;
}

export const DEFAULT_ITEM_KIND = 'PRODUCT';
