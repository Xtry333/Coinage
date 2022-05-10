import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { DecimalToNumberTransformer } from './transformers/decimal-to-number.transformer';
import { Item } from './Item.entity';
import { Transfer } from './Transfer.entity';

@Entity()
export class TransferItem {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ name: 'unit_price', type: 'decimal', default: 0, precision: 20, scale: 2, nullable: false, transformer: new DecimalToNumberTransformer() })
    public unitPrice!: number;

    @Column({ name: 'units', type: 'float', nullable: false, default: 1 })
    public units!: number;

    @ManyToOne(() => Transfer, (transfer) => transfer.transferItems, { eager: false, nullable: false })
    @JoinColumn({ name: 'transfer_id' })
    public transfer!: Promise<Transfer>;

    @ManyToOne(() => Item, { eager: true, nullable: false })
    @JoinColumn({ name: 'item_id' })
    public item!: Item;
}
