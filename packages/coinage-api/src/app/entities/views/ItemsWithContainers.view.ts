import { ManyToOne, ViewColumn, ViewEntity } from 'typeorm';
import { Container } from '../Container.entity';
import { Item } from '../Item.entity';
import { TransferItem } from '../TransferItem.entity';

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
    container.name AS container_name,
    container.weight AS container_weight,
    container.weight_unit AS container_weight_unit,
    container.volume AS container_volume,
    container.volume_unit AS container_volume_unit,
    container.item_count AS container_item_count
FROM item 
JOIN transfer_item ON item.id = transfer_item.item_id
JOIN container ON container.id = transfer_item.container_id
GROUP BY item.id, container.id`,
    dependsOn: [Item, Container, TransferItem],
})
export class ItemsWithContainers {
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
    public containerId!: number;

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

    @ViewColumn()
    public containerItemCount!: number | null;

    // Keep these for backward compatibility if needed
    @ManyToOne(() => Item, { eager: true, nullable: false })
    public item!: Item | null;

    @ManyToOne(() => Container, { eager: true, nullable: false })
    public container!: Container | null;
}
