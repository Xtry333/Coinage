import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Item } from './Item.entity';

@Entity()
export class Tag {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ type: 'varchar', length: 64, nullable: false, unique: true })
    public name!: string;

    @Column({ type: 'varchar', length: 7, nullable: true })
    public color!: string | null;

    @ManyToMany(() => Item, (item) => item.tags)
    public items!: Item[];
}
