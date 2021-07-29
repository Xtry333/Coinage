export interface Message {
    message: string;
    millis: number;
}

export interface TransferDTO {
    id: number;
    description: string;
    contractor?: string;
    amount: number;
    type: string;
    category: string;
    categoryId: number;
    date: string;
}

export interface AccountDTO {
    id: number;
    name: string;
}

export interface CategoryPathDTO {
    id: number;
    name: string;
}

export interface TransferDetailsDTO {
    id: number;
    description: string;
    amount: number;
    type: string;
    account?: AccountDTO;
    categoryPath: CategoryPathDTO[];
    categoryId: number;
    contractor?: string;
    contractorId?: number;
    date: string;
    createdDate?: Date;
    editedDate: Date;
    otherTransfers: TransferDTO[];
}

export interface TotalAmountPerMonthDTO {
    year: number;
    month: number;
    outcomes: number;
    incomes: number;
    transactionsCount: number;
}
