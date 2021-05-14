import {
    Entity,
    JoinColumn,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
} from 'typeorm';
import { Category } from './Category.entity';
import { Contractor } from './Contractor.entity';
import { Receipt } from './Receipt.entity';

@Entity()
export class Transfer {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('text', { nullable: false })
    description: string;

    @Column('decimal', { precision: 20, scale: 2, nullable: false })
    amount: string; // Decimal returns a string for precision, we will parse it later in DTO

    @Column({ type: 'date', nullable: true })
    date: string;

    @Column({ name: 'edited_date', type: 'timestamp', nullable: false })
    editedDate: Date;

    @Column({ name: 'created_date', type: 'timestamp', nullable: true })
    createdDate: Date;

    @ManyToOne('Category', { eager: true, nullable: true })
    @JoinColumn({ name: 'category' })
    category: Category;

    @ManyToOne('Contractor', { eager: true, nullable: true })
    @JoinColumn({ name: 'contractor' })
    contractor: Contractor | null;

    @ManyToOne('Receipt', { eager: true, nullable: true })
    @JoinColumn({ name: 'receipt' })
    receipt: Receipt;

    @Column('varchar', { length: 50, nullable: false })
    type: string;
}
