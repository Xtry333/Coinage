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

    @Column({ name: 'amount', type: 'decimal', precision: 20, scale: 2, nullable: false })
    amount!: string; // Decimal returns a string for precision, need to parse later in DTO

    get price(): number {
        return Number(this.amount);
    }

    set price(value: number) {
        this.amount = value.toString();
    }

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

    @Column({ name: 'contractor', type: 'integer', nullable: true })
    contractorId?: number;

    @ManyToOne('Contractor', { eager: true, nullable: true })
    @JoinColumn({ name: 'contractor' })
    contractor?: Contractor | undefined;

    @Column({ name: 'receipt', type: 'numeric', nullable: true })
    receiptId?: number | undefined;

    @ManyToOne('Receipt', { eager: false, nullable: true })
    @JoinColumn({ name: 'receipt' })
    receipt?: Receipt | undefined;

    @Column('varchar', { length: 50, nullable: false })
    type!: TransferTypeEnum;

    @Column({ type: 'numeric' })
    accountId!: number;

    @ManyToOne('Account', { eager: true, nullable: true })
    @JoinColumn({ name: 'account_id' })
    account!: Account;

    @Column('bit', { nullable: false })
    isInternal!: boolean;

    @Column({ nullable: true, type: 'json' })
    metadata!: TransferMetadata & { [key: string]: string | number };
}

interface TransferMetadata {
    location?: string;
    unitPrice?: number;
    redundedBy?: number;
    refundTargetId?: number;
    subject?: string;
}
