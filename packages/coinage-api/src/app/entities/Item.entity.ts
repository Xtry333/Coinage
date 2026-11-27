import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Category } from './Category.entity';
import { ItemKind } from './ItemKind.entity';
import { Tag } from './Tag.entity';
import { WithDateEntity } from './WithDate.partialEntity';

@Entity()
export class Item extends WithDateEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ type: 'varchar', length: 50, nullable: true })
    public brand!: string | null;

    @Column({ type: 'varchar', length: 50, nullable: false })
    public name!: string;

    @Column({ type: 'varchar', length: 32, default: 'PRODUCT' })
    public kindCode!: string;

    @ManyToOne(() => ItemKind, { nullable: false, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'kind_code', referencedColumnName: 'code', foreignKeyConstraintName: 'fk_item_kind' })
    public kind!: ItemKind;

    @Column({ name: 'category_id', nullable: true })
    public categoryId!: number | null;

    @ManyToOne(() => Category, { eager: false, nullable: true, onUpdate: 'CASCADE', onDelete: 'SET NULL' })
    @JoinColumn({ name: 'category_id' })
    public category!: Promise<Category | null>;

    @ManyToMany(() => Tag, (tag) => tag.items, { eager: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinTable({
        name: 'item_tag',
        joinColumn: { name: 'item_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
    })
    public tags!: Tag[];

    @Column({ type: 'float', nullable: true })
    public containerSize!: number | null;

    @Column({ type: 'varchar', length: 16, nullable: true })
    public containerSizeUnit!: string | null;

    @Column({ default: false })
    public isArchived!: boolean;
}
