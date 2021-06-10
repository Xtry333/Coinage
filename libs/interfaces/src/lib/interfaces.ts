export interface Message {
    message: string;
    millis: number;
}

export interface TransferDTO {
    id: number;
    description: string;
    amount: number;
    category: string;
    categoryId: number;
    date: string;
}

export interface CategoryPathDTO {
    id: number;
    name: string;
}

export interface TransferDetailsDTO {
    id: number;
    description: string;
    amount: number;
    categoryPath: CategoryPathDTO[];
    categoryId: number;
    contractor?: string;
    contractorId?: number;
    date: string;
    createdDate: Date;
    editedDate: Date;
    otherTransfers: TransferDTO[];
}

export interface TotalOutcomesPerMonthDTO {
    year: number;
    month: number;
    amount: number;
    transactionsCount: number;
}
