import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Category } from './Category.entity';
import { DateTransformer, DateTransformerType } from './transformers/date.transformer';

@Entity()
export class Item {
    public constructor() {
        this.editedDate = new Date();
        this.createdDate = new Date();
    }

    @PrimaryGeneratedColumn()
    public id!: number;

    @Column('varchar', { length: 50, nullable: false })
    public name!: string;
    
    @Column({ type: 'integer', nullable: true })
    public categoryId!: number | null;

    @ManyToOne(() => Category, { eager: false, nullable: false, onUpdate: 'CASCADE', onDelete: 'SET NULL' })
    @JoinColumn({ name: 'category_id' })
    public category!: Promise<Category | null>;

    @UpdateDateColumn({ name: 'edited_date', type: 'timestamp', nullable: false, transformer: new DateTransformer(DateTransformerType.DATETIME) })
    public readonly editedDate!: Date;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp', nullable: false, transformer: new DateTransformer(DateTransformerType.DATETIME) })
    public readonly createdDate!: Date;
}
