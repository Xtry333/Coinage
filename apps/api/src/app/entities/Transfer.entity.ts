import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { DateTransformer, DateTransformerType } from './transformers/date.transformer';

import { Account } from './Account.entity';
import { BooleanTransformer } from './transformers/boolean.transformer';
import { Category } from './Category.entity';
import { Contractor } from './Contractor.entity';
import { Receipt } from './Receipt.entity';
import { TransferTypeEnum } from '@coinage-app/interfaces';

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
    _amount!: string; // Decimal returns a string for precision, need to parse later in DTO

    get amount(): number {
        return Number(this._amount);
    }

    set amount(value: number) {
        this._amount = value.toFixed(2);
    }

    @Column({
        type: 'date',
        nullable: false,
        transformer: new DateTransformer(DateTransformerType.DATE),
    })
    date!: Date;

    @UpdateDateColumn({ name: 'edited_date', type: 'timestamp', nullable: false, transformer: new DateTransformer(DateTransformerType.DATETIME) })
    editedDate!: Date;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp', nullable: true, transformer: new DateTransformer(DateTransformerType.DATETIME) })
    createdDate!: Date;

    @Column({ name: 'category', type: 'integer', nullable: false })
    categoryId!: number;

    @ManyToOne('Category', { eager: true, nullable: false })
    @JoinColumn({ name: 'category' })
    category!: Category;

    @Column({ name: 'contractor', type: 'integer', nullable: true })
    contractorId?: number | null;

    @ManyToOne('Contractor', { eager: true, nullable: true })
    @JoinColumn({ name: 'contractor' })
    contractor?: Contractor | null;

    @Column({ name: 'receipt', type: 'numeric', nullable: true })
    receiptId?: number | null;

    @ManyToOne('Receipt', { eager: false, nullable: true })
    @JoinColumn({ name: 'receipt' })
    receipt?: Receipt | null;

    @Column({ name: 'type', type: 'varchar', length: 50, nullable: false })
    type!: TransferTypeEnum;

    @Column({ type: 'numeric' })
    accountId!: number;

    @ManyToOne('Account', { eager: true, nullable: true })
    @JoinColumn({ name: 'account_id' })
    account!: Account;

    @Column({ name: 'is_internal', type: 'bit', nullable: false, transformer: new BooleanTransformer() })
    isInternal!: boolean;

    @Column({ name: 'is_ethereal', type: 'bit', nullable: false, transformer: new BooleanTransformer() })
    isEthereal!: boolean;

    @Column({ nullable: true, type: 'json', default: {} })
    metadata!: TransferMetadata & { [key: string]: string | number | undefined };
}

interface TransferMetadata {
    location?: string;
    unitPrice?: number;
    redundedBy?: number;
    refundTargetId?: number;
    subject?: string;
    subjectDate?: string;
}
