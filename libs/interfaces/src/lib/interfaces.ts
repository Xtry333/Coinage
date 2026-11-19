import { EffectiveTagDTO } from './TagDTO.response';

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
    description: string | null;
    date?: Date | null;
    amount: number | null;
    contractor?: string;
    transferIds: number[];
    tags: EffectiveTagDTO[];
}

export class Range<T> {
    public from!: T;
    public to!: T;
}
