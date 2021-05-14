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
    contractor: string;
    date: string;
    createdDate: Date;
    editedDate: Date;
    otherTransfers: TransferDTO[];
}
