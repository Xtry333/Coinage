import { ManyToOne, ViewColumn, ViewEntity } from 'typeorm';

import { Container } from '../Container.entity';
import { Item } from '../Item.entity';
import { ItemPackaging } from '../ItemPackaging.entity';
import { DecimalToNumberTransformer } from '../transformers/decimal-to-number.transformer';
import { ItemPackagingContents } from './ItemPackagingContents.view';

@ViewEntity({
    expression: `
SELECT 
    item.id AS item_id,
    item.brand AS item_brand,
    item.name AS item_name,
    item.category_id AS item_category_id,
    item.container_size AS item_container_size,
    item.container_size_unit AS item_container_size_unit,
    item.created_date AS item_created_date,
    item.edited_date AS item_updated_date,
    container.id AS container_id,
    packaging.name AS container_name,
    contents.weight AS container_weight,
    contents.weight_unit AS container_weight_unit,
    contents.volume AS container_volume,
    contents.volume_unit AS container_volume_unit,
    contents.item_count AS container_item_count,
    packaging.id AS packaging_id
FROM item_packaging packaging
JOIN item ON item.id = packaging.item_id
JOIN item_packaging_contents contents ON contents.id = packaging.id
LEFT JOIN container ON container.id = packaging.container_id
WHERE NOT packaging.is_archived`,
    dependsOn: [Item, Container, ItemPackaging, ItemPackagingContents],
})
export class ItemsWithContainers {
    @ViewColumn()
    public packagingId!: number;
    @ViewColumn()
    public itemId!: number;

    @ViewColumn()
    public itemBrand!: string | null;

    @ViewColumn()
    public itemName!: string;

    @ViewColumn()
    public itemCategoryId!: number | null;

    @ViewColumn()
    public itemContainerSize!: number | null;

    @ViewColumn()
    public itemContainerSizeUnit!: string | null;

    @ViewColumn()
    public itemCreatedDate!: Date;

    @ViewColumn()
    public itemUpdatedDate!: Date;

    @ViewColumn()
    public containerId!: number | null;

    @ViewColumn()
    public containerName!: string | null;

    @ViewColumn()
    public containerWeight!: number | null;

    @ViewColumn()
    public containerWeightUnit!: string | null;

    @ViewColumn()
    public containerVolume!: number | null;

    @ViewColumn()
    public containerVolumeUnit!: string | null;

    @ViewColumn({ transformer: new DecimalToNumberTransformer() })
    public containerItemCount!: number | null;

    // Keep these for backward compatibility if needed
    @ManyToOne(() => Item, { eager: true, nullable: false })
    public item!: Item | null;

    @ManyToOne(() => Container, { eager: true, nullable: true })
    public container!: Container | null;
}
