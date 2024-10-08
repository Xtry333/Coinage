import { ValueTransformer } from 'typeorm';

export class DecimalToNumberTransformer implements ValueTransformer {
    public constructor(private readonly fractionDigits: number = 2) {}

    public from(value: string | null): number | null {
        if (value === null) {
            return null;
        }

        return parseFloat(value);
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    public to(value: Number | null): string | null | undefined {
        if (value === null) {
            return null;
        }

        if (value instanceof Number) {
            return value?.toFixed(this.fractionDigits);
        }

        return value;
    }
}
