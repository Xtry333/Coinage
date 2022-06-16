import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from './Category.entity';
import { WithDateEntity } from './WithDate.partialEntity';

@Entity()
export class Item extends WithDateEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ type: 'varchar', length: 50, nullable: true })
    public brand!: string;

    @Column({ type: 'varchar', length: 50, nullable: false })
    public name!: string;

    @Column({ nullable: true })
    public categoryId!: number | null;

    @ManyToOne(() => Category, { eager: false, nullable: false, onUpdate: 'CASCADE', onDelete: 'SET NULL' })
    @JoinColumn({ name: 'category_id' })
    public category!: Promise<Category | null>;

    @Column({ type: 'float', nullable: true })
    public containerSize!: number;

    @Column({ type: 'varchar', length: 16, nullable: true })
    public containerSizeUnit!: string;
}
