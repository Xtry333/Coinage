import { ViewEntity, ViewColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Item } from '../Item.entity';
import { Container } from '../Container.entity';
import { TransferItem } from '../TransferItem.entity';

@ViewEntity({
    expression: `
SELECT item.id AS item_id, container.id AS container_id FROM item 
JOIN transfer_item ON item.id = transfer_item.item_id
JOIN container ON container.id = transfer_item.container_id
GROUP BY item.id, container.id`,
    dependsOn: [Item, Container, TransferItem],
})
export class ItemsWithContainers {
    @ViewColumn()
    public itemId!: number;

    // Temporary Join before I get less lazy and create all proper fields for Item
    @ManyToOne(() => Item, { eager: true, nullable: false })
    public item!: Item | null;

    @ViewColumn()
    public containerId!: number;

    // Temporary Join before I get less lazy and create all proper fields for Container
    @ManyToOne(() => Container, { eager: true, nullable: false })
    public container!: Container | null;
}
