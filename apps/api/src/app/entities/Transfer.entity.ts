import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { DateTransformer, DateTransformerType } from './transformers/date.transformer';

import { Account } from './Account.entity';
import { BooleanTransformer } from './transformers/boolean.transformer';
import { Category } from './Category.entity';
import { Contractor } from './Contractor.entity';
import { Receipt } from './Receipt.entity';
import { TransferItem } from './TransferItem.entity';
import { TransferTypeEnum } from '@coinage-app/interfaces';
import { DecimalToNumberTransformer } from './transformers/decimal-to-number.transformer';

@Entity()
export class Transfer {
    constructor() {
        this.metadata = {};
    }

    @PrimaryGeneratedColumn()
    id!: number;

    @Column('text', { nullable: false })
    description!: string;

    @Column({ name: 'amount', type: 'decimal', precision: 20, scale: 2, nullable: false, transformer: new DecimalToNumberTransformer() })
    amount!: number;

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

    @Column({ type: 'integer', nullable: false })
    categoryId!: number;

    @ManyToOne(() => Category, { eager: true, nullable: false })
    @JoinColumn({ name: 'category_id' })
    category!: Category;

    @Column({ type: 'integer', nullable: true })
    contractorId?: number | null;

    @ManyToOne(() => Contractor, { eager: true, nullable: true })
    @JoinColumn({ name: 'contractor_id' })
    contractor?: Contractor | null;

    @Column({ type: 'integer', nullable: true })
    receiptId?: number | null;

    @ManyToOne(() => Receipt, { eager: false, nullable: true })
    @JoinColumn({ name: 'receipt_id' })
    receipt!: Promise<Receipt | null>;

    @Column({ name: 'type', type: 'varchar', length: 50, nullable: false })
    type!: TransferTypeEnum;

    @Column({ type: 'integer' })
    accountId!: number;

    @ManyToOne(() => Account, { eager: true, nullable: false })
    @JoinColumn({ name: 'account_id' })
    account!: Account;

    @Column({ name: 'is_internal', type: 'bit', nullable: false, transformer: new BooleanTransformer() })
    isInternal!: boolean;

    @Column({ name: 'is_ethereal', type: 'bit', nullable: false, transformer: new BooleanTransformer() })
    isEthereal!: boolean;

    @Column({ nullable: true, type: 'json', default: {} })
    metadata!: TransferMetadata & { [key: string]: string | number | undefined };

    @OneToMany(() => TransferItem, (transferItem) => transferItem.transfer, { eager: true, cascade: true })
    transferItems!: TransferItem[];
}

interface TransferMetadata {
    location?: string;
    unitPrice?: number;
    redundedBy?: number;
    refundTargetId?: number;
    subject?: string;
    subjectDate?: string;
}
