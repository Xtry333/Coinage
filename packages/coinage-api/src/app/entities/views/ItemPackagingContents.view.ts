import { PrimaryColumn, ViewColumn, ViewEntity } from 'typeorm';

import { DecimalToNumberTransformer } from '../transformers/decimal-to-number.transformer';

@ViewEntity({
    name: 'item_packaging_contents',
    expression: `
WITH RECURSIVE contents AS (
    SELECT id, weight, weight_unit, volume, volume_unit, item_count::numeric AS item_count, 1 AS nesting_depth
    FROM item_packaging WHERE contained_packaging_id IS NULL
    UNION ALL
    SELECT p.id, c.weight * p.contained_count, c.weight_unit,
        c.volume * p.contained_count, c.volume_unit,
        COALESCE(c.item_count, 1) * p.contained_count, c.nesting_depth + 1
    FROM item_packaging p JOIN contents c ON c.id = p.contained_packaging_id
    WHERE c.nesting_depth < 32
)
SELECT c.*, child.name AS contained_name
FROM contents c JOIN item_packaging p ON p.id = c.id
LEFT JOIN item_packaging child ON child.id = p.contained_packaging_id`,
    dependsOn: ['item_packaging'],
})
export class ItemPackagingContents {
    @PrimaryColumn({ type: 'int' }) public id!: number;
    @ViewColumn() public weight!: number | null;
    @ViewColumn() public weightUnit!: string | null;
    @ViewColumn() public volume!: number | null;
    @ViewColumn() public volumeUnit!: string | null;
    @ViewColumn({ transformer: new DecimalToNumberTransformer() }) public itemCount!: number | null;
    @ViewColumn() public nestingDepth!: number;
    @ViewColumn() public containedName!: string | null;
}
