import { ValueTransformer } from 'typeorm';

export class TimestampTransformer implements ValueTransformer {
    public from(value: number | null): Date | null {
        if (value === null) {
            return null;
        }
        return new Date(value);
    }

    public to(value: Date | null): number | null {
        if (value instanceof Date) {
            return value.getTime();
        }
        return value;
    }
}
