export interface SaveTransferDTO {
    id?: number;
    description: string;
    amount: number;
    categoryId: number;
    contractorId?: number | null;
    originAccountId: number;
    date: string;
}
