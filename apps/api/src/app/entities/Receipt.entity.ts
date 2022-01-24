import { Entity, Column, PrimaryGeneratedColumn, OneToMany, JoinColumn, ManyToOne } from 'typeorm';
import { Contractor } from './Contractor.entity';
import { Transfer } from './Transfer.entity';

@Entity()
export class Receipt {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('text', { nullable: false })
    description!: string;

    @Column({ name: 'amount', type: 'decimal', precision: 20, scale: 2, nullable: false })
    _amount!: string; // Decimal returns a string for precision, need to parse later in DTO

    get amount(): number {
        return Number(this._amount);
    }

    set amount(value: number) {
        this._amount = value.toFixed(2);
    }

    @Column({ type: 'date', nullable: true })
    date!: string | null;

    @ManyToOne('Contractor', { eager: true, nullable: true })
    @JoinColumn({ name: 'contractor' })
    contractor?: Contractor | null;

    @OneToMany('Transfer', 'receipt', { eager: true })
    transfers!: Promise<Transfer[]>;
}
