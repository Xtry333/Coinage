import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Container } from './Container.entity';
import { Item } from './Item.entity';
import { ItemPackaging } from './ItemPackaging.entity';
import { Transfer } from './Transfer.entity';
import { DecimalToNumberTransformer } from './transformers/decimal-to-number.transformer';

@Entity()
@Index('idx_transfer_item_packaging', ['packagingId'])
export class TransferItem {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ type: 'decimal', default: 0, precision: 12, scale: 2, nullable: false, transformer: new DecimalToNumberTransformer() })
    public unitPrice!: number;

    @Column({ type: 'decimal', default: 0, precision: 12, scale: 2, nullable: false, transformer: new DecimalToNumberTransformer() })
    public totalSetPrice!: number;

    @Column({ type: 'decimal', default: 0, precision: 12, scale: 2, nullable: false, transformer: new DecimalToNumberTransformer() })
    public totalSetDiscount!: number;

    @Column({ type: 'float', nullable: false, default: 1 })
    public quantity!: number;

    @Column({ nullable: false })
    public transferId!: number;

    @ManyToOne(() => Transfer, (transfer) => transfer.transferItems, { eager: false, nullable: false, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
    @JoinColumn({ name: 'transfer_id' })
    public transfer!: Promise<Transfer>;

    @Column({ nullable: false })
    public itemId!: number;

    @ManyToOne(() => Item, { eager: true, nullable: false, onUpdate: 'CASCADE', onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'item_id' })
    public item!: Item;

    @Column({ nullable: true })
    public containerId!: number | null;

    @ManyToOne(() => Container, { eager: true, nullable: true, onUpdate: 'CASCADE', onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'container_id' })
    public container!: Promise<Container>;

    @Column({ type: 'int', nullable: true })
    public packagingId?: number | null;

    @ManyToOne(() => ItemPackaging, { eager: true, nullable: true, onDelete: 'RESTRICT' })
    @JoinColumn([
        { name: 'packaging_id', referencedColumnName: 'id', foreignKeyConstraintName: 'fk_transfer_item_packaging_item' },
        { name: 'item_id', referencedColumnName: 'itemId', foreignKeyConstraintName: 'fk_transfer_item_packaging_item' },
    ])
    public packaging!: ItemPackaging | null;
}
