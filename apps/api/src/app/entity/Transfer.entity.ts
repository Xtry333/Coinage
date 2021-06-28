import { Entity, JoinColumn, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Category } from './Category.entity';
import { Contractor } from './Contractor.entity';
import { Receipt } from './Receipt.entity';

@Entity()
export class Transfer {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('text', { nullable: false })
    description!: string;

    @Column('decimal', { precision: 20, scale: 2, nullable: false })
    amount!: string; // Decimal returns a string for precision, need to parse later in DTO

    @Column({ type: 'date', nullable: false })
    date!: string;

    @Column({ name: 'edited_date', type: 'timestamp', nullable: false })
    editedDate!: Date;

    @Column({ name: 'created_date', type: 'timestamp', nullable: true })
    createdDate?: Date;

    @ManyToOne('Category', { eager: true, nullable: false })
    @JoinColumn({ name: 'category' })
    category!: Category;

    @ManyToOne('Contractor', { eager: true, nullable: true })
    @JoinColumn({ name: 'contractor' })
    contractor?: Contractor | undefined;

    @ManyToOne('Receipt', { eager: true, nullable: true })
    @JoinColumn({ name: 'receipt' })
    receipt?: Receipt | undefined;

    @Column('varchar', { length: 50, nullable: false })
    type!: string;

    @Column({ nullable: true })
    user?: number;

    @Column({ nullable: true, type: 'json' })
    metadata?: { [key: string]: string | number };
}
