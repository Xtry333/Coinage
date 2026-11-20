import { Check, Column, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { Container } from './Container.entity';
import { Item } from './Item.entity';
import { ItemPackagingContents } from './views/ItemPackagingContents.view';

@Entity()
@Unique('uq_item_packaging_identity', ['id', 'itemId'])
@Index('idx_item_packaging_item', ['itemId'])
@Index('uq_item_packaging_preferred', ['itemId'], { unique: true, where: 'is_preferred AND NOT is_archived' })
@Index('idx_item_packaging_contained', ['containedPackagingId'])
@Check('ck_item_packaging_not_self', 'contained_packaging_id IS NULL OR contained_packaging_id <> id')
@Check('ck_item_packaging_name', 'LENGTH(BTRIM(name)) > 0')
@Check(
    'ck_item_packaging_contained_count',
    '(contained_packaging_id IS NULL AND contained_count IS NULL) OR (contained_packaging_id IS NOT NULL AND contained_count IS NOT NULL AND contained_count > 0)',
)
@Check(
    'ck_item_packaging_leaf_contents',
    'contained_packaging_id IS NULL OR (weight IS NULL AND weight_unit IS NULL AND volume IS NULL AND volume_unit IS NULL AND item_count IS NULL)',
)
export class ItemPackaging {
    @PrimaryGeneratedColumn() public id!: number;
    @Column() public itemId!: number;
    @Column({ type: 'varchar', length: 64, default: 'Package' }) public name!: string;
    @ManyToOne(() => Item, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'item_id', foreignKeyConstraintName: 'fk_item_packaging_item' })
    public item!: Item;

    @Column({ type: 'int', nullable: true }) public containerId!: number | null;
    @ManyToOne(() => Container, { eager: true, nullable: true, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'container_id', foreignKeyConstraintName: 'fk_item_packaging_container' })
    public container!: Container | null;

    @Column({ type: 'int', nullable: true }) public containedPackagingId!: number | null;
    @Column({ type: 'int', nullable: true }) public containedCount!: number | null;
    @ManyToOne(() => ItemPackaging, { nullable: true, onDelete: 'RESTRICT' })
    @JoinColumn([
        { name: 'contained_packaging_id', referencedColumnName: 'id', foreignKeyConstraintName: 'fk_item_packaging_contained_item' },
        { name: 'item_id', referencedColumnName: 'itemId', foreignKeyConstraintName: 'fk_item_packaging_contained_item' },
    ])
    public containedPackaging!: ItemPackaging | null;

    @OneToOne(() => ItemPackagingContents, { eager: true, nullable: true, createForeignKeyConstraints: false, persistence: false })
    @JoinColumn({ name: 'id', referencedColumnName: 'id' })
    public contents?: ItemPackagingContents | null;

    // Stored only for leaf packages. Composite totals are read from item_packaging_contents.
    @Column({ type: 'float', nullable: true }) public weight!: number | null;
    @Column({ type: 'varchar', length: 8, nullable: true }) public weightUnit!: string | null;
    @Column({ type: 'float', nullable: true }) public volume!: number | null;
    @Column({ type: 'varchar', length: 8, nullable: true }) public volumeUnit!: string | null;
    @Column({ type: 'int', nullable: true }) public itemCount!: number | null;
    @Column({ type: 'varchar', length: 64, nullable: true }) public barcode!: string | null;
    @Column({ default: false }) public isPreferred!: boolean;
    @Column({ default: false }) public isArchived!: boolean;
}
