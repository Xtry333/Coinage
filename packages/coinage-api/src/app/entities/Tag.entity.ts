import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Item } from './Item.entity';
import { Transfer } from './Transfer.entity';

@Entity()
export class Tag {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ type: 'varchar', length: 64, nullable: false, unique: true })
    public name!: string;

    @Column({ type: 'varchar', length: 7, nullable: true })
    public color!: string | null;

    @ManyToMany(() => Item, (item) => item.tags, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    public items!: Item[];

    @ManyToMany(() => Transfer, (transfer) => transfer.tags, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    public transfers!: Transfer[];
}
