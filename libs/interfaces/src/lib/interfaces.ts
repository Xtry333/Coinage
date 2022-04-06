import { TransferDTO } from './FilteredTransferDTO.response';

export interface Message {
    message: string;
    millis: number;
}

export interface AccountDTO {
    id: number;
    name: string;
}

export interface CategoryPathDTO {
    id: number;
    name: string;
}

export interface ReceiptDTO {
    id: number;
    description: string;
    date?: Date | null;
    amount: number | null;
    contractor?: string;
    transferIds: number[];
}

export interface Range<T> {
    from: T;
    to: T;
}
