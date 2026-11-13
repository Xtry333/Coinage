// Deprecated: PostgreSQL `boolean` columns are handled natively by the `pg` driver.
// Kept for reference; no longer used by any entity.

import { ValueTransformer } from 'typeorm';

export class BooleanTransformer implements ValueTransformer {
    public from(value: boolean | null | undefined): boolean | null | undefined {
        return value;
    }

    public to(value: boolean): boolean | undefined | null {
        return value;
    }
}
