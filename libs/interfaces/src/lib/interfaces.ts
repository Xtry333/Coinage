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
}
