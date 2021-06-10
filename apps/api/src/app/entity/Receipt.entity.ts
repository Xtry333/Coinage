import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Transfer } from './Transfer.entity';

@Entity()
export class Receipt {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('text', { nullable: false })
    description!: string;

    @Column({ type: 'date', nullable: true })
    date!: string;

    @OneToMany('Transfer', 'receipt')
    transfer!: Promise<Transfer[]>;
}
