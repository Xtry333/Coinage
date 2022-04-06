import { ValueTransformer } from 'typeorm';

export const enum BooleanTransformerType {
    BUFFER = 'buffer',
}

export class BooleanTransformer implements ValueTransformer {
    constructor(private readonly type: BooleanTransformerType = BooleanTransformerType.BUFFER) {}

    public from(value: Buffer | null | undefined): boolean | null | undefined {
        if (value === null) {
            return null;
        }
        if (value === undefined) {
            return undefined;
        }

        if (value instanceof Buffer && this.type === BooleanTransformerType.BUFFER) {
            return value.at(0) === 1;
        }

        return !!value;
    }

    public to(value: boolean): boolean | undefined | null {
        if (value === null) {
            return null;
        }
        if (value === undefined) {
            return undefined;
        }

        return !!value;
    }
}
