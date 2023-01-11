import { FindOperator, ValueTransformer } from 'typeorm';

export const enum DateTransformerType {
    DATETIME = 'datetime',
    DATE = 'date',
    // TIMESTAMP = 'timestamp',
}

export class DateTransformer implements ValueTransformer {
    constructor(private readonly type: DateTransformerType = DateTransformerType.DATETIME) {}

    public from(value: string | null): Date | null {
        if (value === null) {
            return null;
        }
        return new Date(`${value} UTC`);
    }

    public to(value: Date): string {
        if (value instanceof Date) {
            const date = value.toISOString().substring(0, 10);
            const time = value.toISOString().substring(11, 19);
            if (this.type === DateTransformerType.DATETIME) {
                return `${date} ${time}`;
            } else {
                return date;
            }
        }
        return value;
    }
}
