import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Container } from './Container.entity';
import { Item } from './Item.entity';
import { Transfer } from './Transfer.entity';
import { DecimalToNumberTransformer } from './transformers/decimal-to-number.transformer';

@Entity()
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
}
