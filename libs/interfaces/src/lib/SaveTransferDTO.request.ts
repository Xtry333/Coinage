export interface SaveTransferDTO {
    id?: number;
    description: string;
    amount: number;
    categoryId: number;
    contractorId?: number | null;
    accountId: number;
    date: string;
}
