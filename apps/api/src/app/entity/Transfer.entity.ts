import {
    Entity,
    JoinColumn,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
} from 'typeorm';
import { Category } from './Category.entity';
import { Contractor } from './Contractor.entity';

@Entity()
export class Transfer {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('text', { nullable: false })
    description: string;

    @Column('decimal', { precision: 20, scale: 2, nullable: false })
    amount: number;

    @Column({ nullable: true })
    date: Date;

    @Column({ nullable: true })
    edited_date: string;

    @ManyToOne(() => Category, { eager: true, nullable: true })
    @JoinColumn({ name: 'category' })
    category: Category;

    @ManyToOne(() => Contractor, { eager: true, nullable: true })
    @JoinColumn({ name: 'contractor' })
    contractor: Contractor;

    @Column('varchar', { length: 50, nullable: false })
    type: string;
}
