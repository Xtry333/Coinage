import { Entity, Column, PrimaryGeneratedColumn, OneToMany, JoinColumn, ManyToOne } from 'typeorm';
import { Contractor } from './Contractor.entity';
import { Transfer } from './Transfer.entity';

@Entity()
export class Receipt {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('text', { nullable: false })
    description?: string;

    @Column('decimal', { precision: 20, scale: 2, nullable: false })
    amount!: string; // Decimal returns a string for precision, need to parse later in DTO

    @Column({ type: 'date', nullable: true })
    date!: string;

    @ManyToOne('Contractor', { eager: true, nullable: true })
    @JoinColumn({ name: 'contractor' })
    contractor?: Contractor | undefined;

    @OneToMany('Transfer', 'receipt', { eager: true })
    transfers!: Promise<Transfer[]>;
}
