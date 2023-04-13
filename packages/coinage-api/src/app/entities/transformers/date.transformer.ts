import { ValueTransformer } from 'typeorm';

export const enum DateTransformerType {
    DATETIME = 'datetime',
    DATE = 'date',
    // TIMESTAMP = 'timestamp',
}

export class DateTransformer implements ValueTransformer {
    public constructor(private readonly type: DateTransformerType = DateTransformerType.DATETIME) {}

    public from(value: string | null): Date | null {
        if (value === null) {
            return null;
        }
        return new Date(`${value}`);
    }

    public to(value: Date): string {
        if (value instanceof Date) {
            const date = value.toISOString().substring(0, 10);
            const time = value.toISOString().substring(11, 19);
            if (this.type === DateTransformerType.DATETIME) {
                const dateWithOffest = new Date(value.getTime() - value.getTimezoneOffset() * 60000);

                return `${dateWithOffest.toISOString().slice(0, 19).replace('T', ' ')}`;
            } else {
                return date;
            }
        }
        return value;
    }
}
