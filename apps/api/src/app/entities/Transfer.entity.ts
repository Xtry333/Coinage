import { TransferTypeEnum } from '@coinage-app/interfaces';
import { Entity, JoinColumn, Column, PrimaryGeneratedColumn, ManyToOne, UpdateDateColumn, CreateDateColumn } from 'typeorm';
import { Account } from './Account.entity';
import { Category } from './Category.entity';
import { Contractor } from './Contractor.entity';
import { Receipt } from './Receipt.entity';

@Entity()
export class Transfer {
    constructor() {
        this.metadata = {};
    }

    @PrimaryGeneratedColumn()
    id!: number;

    @Column('text', { nullable: false })
    description!: string;

    @Column('decimal', { precision: 20, scale: 2, nullable: false })
    amount!: string; // Decimal returns a string for precision, need to parse later in DTO

    @Column({ type: 'date', nullable: false })
    date!: string;

    @UpdateDateColumn({ name: 'edited_date', type: 'timestamp', nullable: false })
    editedDate!: Date;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp', nullable: true })
    createdDate!: Date;

    @Column({ name: 'category', type: 'integer', nullable: false })
    categoryId!: number;

    @ManyToOne('Category', { eager: true, nullable: false })
    @JoinColumn({ name: 'category' })
    category!: Category;

    @ManyToOne('Contractor', { eager: true, nullable: true })
    @JoinColumn({ name: 'contractor' })
    contractor?: Contractor | undefined;

    @ManyToOne('Receipt', { eager: false, nullable: true })
    @JoinColumn({ name: 'receipt' })
    receipt?: Receipt | undefined;

    @Column('varchar', { length: 50, nullable: false })
    type!: TransferTypeEnum;

    @Column({ nullable: true, type: 'numeric' })
    accountId?: number | undefined;

    @ManyToOne('Account', { eager: true, nullable: true })
    @JoinColumn({ name: 'account_id' })
    account?: Account | undefined;

    @Column('bit', { nullable: false })
    isInternal!: boolean;

    @Column({ nullable: true, type: 'json' })
    metadata!: { [key: string]: string | number };
}

interface TransferMetadata {
    location?: string;
    unitPrice?: number;
    refundTransfer?: number;
    refundTargetId?: number;
    subject?: string;
}
