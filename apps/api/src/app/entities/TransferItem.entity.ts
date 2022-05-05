import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { DecimalToNumberTransformer } from './transformers/decimal-to-number.transformer';
import { Item } from './Item.entity';
import { Transfer } from './Transfer.entity';

@Entity()
export class TransferItem {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'unit_price', type: 'decimal', precision: 20, scale: 2, nullable: false, transformer: new DecimalToNumberTransformer() })
    unitPrice!: number;

    @Column({ name: 'units', type: 'integer', nullable: false })
    units!: number;

    @ManyToOne(() => Transfer, (transfer) => transfer.transferItems, { eager: false, nullable: false })
    @JoinColumn({ name: 'transfer_id' })
    transfer!: Promise<Transfer>;

    @ManyToOne(() => Item, { eager: true, nullable: false })
    @JoinColumn({ name: 'item_id' })
    item!: Item;
}
