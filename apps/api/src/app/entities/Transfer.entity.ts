import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { DateTransformer, DateTransformerType } from './transformers/date.transformer';

import { Account } from './Account.entity';
import { BooleanTransformer } from './transformers/boolean.transformer';
import { Category } from './Category.entity';
import { Contractor } from './Contractor.entity';
import { Receipt } from './Receipt.entity';
import { TransferItem } from './TransferItem.entity';
import { DecimalToNumberTransformer } from './transformers/decimal-to-number.transformer';

@Entity()
export class Transfer {
    public constructor() {
        this.createdDate = new Date();
        this.editedDate = new Date();
        this.metadata = {};
    }

    @PrimaryGeneratedColumn()
    public id!: number;

    @Column('text', { nullable: false })
    public description!: string;

    @Column({ name: 'amount', type: 'decimal', precision: 20, scale: 2, nullable: false, transformer: new DecimalToNumberTransformer() })
    public amount!: number;

    @Column({
        type: 'date',
        nullable: false,
        transformer: new DateTransformer(DateTransformerType.DATE),
    })
    public date!: Date;

    @UpdateDateColumn({ name: 'edited_date', type: 'timestamp', nullable: false, transformer: new DateTransformer(DateTransformerType.DATETIME) })
    public readonly editedDate!: Date;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp', nullable: true, transformer: new DateTransformer(DateTransformerType.DATETIME) })
    public readonly createdDate!: Date;

    @Column({ type: 'integer', nullable: false })
    public categoryId!: number;

    @ManyToOne(() => Category, { eager: true, nullable: false })
    @JoinColumn({ name: 'category_id' })
    public category!: Category;

    @Column({ type: 'integer', nullable: true })
    public contractorId!: number | null;

    @ManyToOne(() => Contractor, { eager: true, nullable: true })
    @JoinColumn({ name: 'contractor_id' })
    public contractor!: Contractor | null;

    @Column({ type: 'integer', nullable: true })
    public receiptId!: number | null;

    @ManyToOne(() => Receipt, { eager: false, nullable: true })
    @JoinColumn({ name: 'receipt_id' })
    public receipt!: Promise<Receipt | null>;

    @Column({ name: 'type', type: 'varchar', length: 50, nullable: false })
    public type!: TransferTypeEnum;

    @Column({ type: 'integer' })
    public accountId!: number;

    @ManyToOne(() => Account, { eager: true, nullable: false })
    @JoinColumn({ name: 'account_id' })
    public account!: Account;

    @Column({ name: 'is_internal', type: 'bit', nullable: false, transformer: new BooleanTransformer() })
    public isInternal!: boolean;

    @Column({ name: 'is_ethereal', type: 'bit', nullable: false, transformer: new BooleanTransformer() })
    public isEthereal!: boolean;

    @Column({ nullable: true, type: 'json', default: {} })
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
}

export enum TransferTypeEnum {
    INCOME = 'INCOME',
    OUTCOME = 'OUTCOME',
}
