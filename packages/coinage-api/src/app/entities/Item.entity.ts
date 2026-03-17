import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from './Category.entity';
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

    @Column({ name: 'category_id', nullable: true })
    public categoryId!: number | null;

    @ManyToOne(() => Category, { eager: false, nullable: true, onUpdate: 'CASCADE', onDelete: 'SET NULL' })
    @JoinColumn({ name: 'category_id' })
    public category!: Promise<Category | null>;

    @ManyToMany(() => Tag, (tag) => tag.items, { eager: true })
    @JoinTable({ name: 'item_tag' })
    public tags!: Tag[];

    @Column({ type: 'float', nullable: true })
    public containerSize!: number | null;

    @Column({ type: 'varchar', length: 16, nullable: true })
    public containerSizeUnit!: string | null;
}
