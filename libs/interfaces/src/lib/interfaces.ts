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
    date: Date;
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
    date: Date;
    createdDate: Date;
    editedDate: Date;
}
