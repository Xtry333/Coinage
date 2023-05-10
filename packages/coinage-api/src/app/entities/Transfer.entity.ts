import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DateTransformer, DateTransformerType } from './transformers/date.transformer';

import { Account } from './Account.entity';
import { BooleanTransformer } from './transformers/boolean.transformer';
import { Category } from './Category.entity';
import { Contractor } from './Contractor.entity';
import { Receipt } from './Receipt.entity';
import { TransferItem } from './TransferItem.entity';
import { DecimalToNumberTransformer } from './transformers/decimal-to-number.transformer';
import { WithDateEntity } from './WithDate.partialEntity';
import { Bit } from '../constants/booleanBuffer.const';
import { User } from './User.entity';
import { Currency } from './Currency.entity';

export enum TransferTypeEnum {
    INCOME = 'INCOME',
    OUTCOME = 'OUTCOME',
    INTERNAL = 'INTERNAL',
}

@Entity()
export class Transfer extends WithDateEntity {
    public constructor() {
        super();
        this.metadata = {};
    }

    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ name: 'description', type: 'text', nullable: false })
    public description!: string;

    @Column({ name: 'amount', type: 'decimal', precision: 20, scale: 2, default: 0, nullable: false, transformer: new DecimalToNumberTransformer() })
    public amount!: number;

    @ManyToOne(() => Currency, { eager: true, nullable: false, onUpdate: 'RESTRICT', onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'currency_symbol' })
    public currency!: Currency;

    @Column({
        name: 'date',
        type: 'date',
        nullable: false,
        transformer: new DateTransformer(DateTransformerType.DATE),
    })
    public date!: Date;

    @Column({
        name: 'accounting_date',
        type: 'date',
        nullable: true,
        transformer: new DateTransformer(DateTransformerType.DATE),
    })
    public accountingDate!: Date | null;


    @Column({ name: 'category_id', nullable: false })
    public categoryId!: number;

    @ManyToOne(() => Category, { eager: true, onUpdate: 'CASCADE', onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'category_id' })
    public category!: Category;

    @Column({ name: 'contractor_id', nullable: true })
    public contractorId!: number | null;

    @ManyToOne(() => Contractor, { eager: true, onUpdate: 'CASCADE', onDelete: 'SET NULL' })
    @JoinColumn({ name: 'contractor_id' })
    public contractor!: Contractor | null;

    @Column({ name: 'owner_user_id', nullable: true })
    public ownerUserId!: number | null;

    @ManyToOne(() => User, { eager: true, onUpdate: 'CASCADE', onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'owner_user_id' })
    public ownerUser!: User | null;

    @Column({ name: 'receipt_id', nullable: true })
    public receiptId!: number | null;

    @ManyToOne(() => Receipt, { eager: false, onUpdate: 'CASCADE', onDelete: 'SET NULL' })
    @JoinColumn({ name: 'receipt_id' })
    public receipt!: Promise<Receipt | null>;

    @Column({ type: 'enum', enum: ['INCOME', 'OUTCOME'], default: 'OUTCOME', nullable: false })
    public type!: TransferTypeEnum;

    @Column({ name: 'account_id', nullable: false })
    public originAccountId!: number;

    @ManyToOne(() => Account, { eager: true, onUpdate: 'CASCADE', onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'account_id' })
    public originAccount!: Account;

    @Column({ name: 'target_account_id', nullable: false })
    public targetAccountId!: number | null;

    @ManyToOne(() => Account, { eager: true, nullable: true, onUpdate: 'CASCADE', onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'target_account_id' })
    public targetAccount!: Account | null;

    @Column({ type: 'bit', nullable: false, default: Bit.False, transformer: new BooleanTransformer() })
    public isEthereal!: boolean;

    @Column({ type: 'bit', nullable: false, default: Bit.False, transformer: new BooleanTransformer() })
    public isFlagged!: boolean;

    @Column({ type: 'json', nullable: false, default: 'json_object()' })
    public metadata!: TransferMetadata & { [key: string]: string | number | undefined };

    @OneToMany(() => TransferItem, (transferItem) => transferItem.transfer, { eager: true, cascade: false })
    public transferItems!: TransferItem[];
}

interface TransferMetadata {
    location?: string;
    unitPrice?: number;
    redundedBy?: number;
    refundTargetId?: number;
    subject?: string;
    subjectDate?: string;
    otherTransferId?: number;
    targetDate?: string;
}

// export enum TransferTypeEnum {
//     INCOME = 'INCOME',
//     OUTCOME = 'OUTCOME',
// }
