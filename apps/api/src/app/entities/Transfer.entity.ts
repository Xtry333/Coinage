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

@Entity()
export class Transfer extends WithDateEntity {
    public constructor() {
        super();
        this.metadata = {};
    }

    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ type: 'text', nullable: false })
    public description!: string;

    @Column({ type: 'decimal', precision: 20, scale: 2, default: 0, nullable: false, transformer: new DecimalToNumberTransformer() })
    public amount!: number;

    @Column({
        type: 'date',
        nullable: false,
        transformer: new DateTransformer(DateTransformerType.DATE),
    })
    public date!: Date;

    @Column({ nullable: false })
    public categoryId!: number;

    @ManyToOne(() => Category, { eager: true, nullable: false, onUpdate: 'CASCADE', onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'category_id' })
    public category!: Category;

    @Column({ nullable: true })
    public contractorId!: number | null;

    @ManyToOne(() => Contractor, { eager: true, nullable: true, onUpdate: 'CASCADE', onDelete: 'SET NULL' })
    @JoinColumn({ name: 'contractor_id' })
    public contractor!: Contractor | null;

    @Column({ nullable: true })
    public receiptId!: number | null;

    @ManyToOne(() => Receipt, { eager: false, nullable: true, onUpdate: 'CASCADE', onDelete: 'SET NULL' })
    @JoinColumn({ name: 'receipt_id' })
    public receipt!: Promise<Receipt | null>;

    @Column({ type: 'enum', enum: ['INCOME', 'OUTCOME'], default: 'OUTCOME', nullable: false })
    public type!: TransferTypeEnum;

    @Column({ nullable: false })
    public accountId!: number;

    @ManyToOne(() => Account, { eager: true, nullable: false, onUpdate: 'CASCADE', onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'account_id' })
    public account!: Account;

    @Column({ type: 'bit', nullable: false, default: "b'0'", transformer: new BooleanTransformer() })
    public isInternal!: boolean;

    @Column({ type: 'bit', nullable: false, default: "b'0'", transformer: new BooleanTransformer() })
    public isEthereal!: boolean;

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

export enum TransferTypeEnum {
    INCOME = 'INCOME',
    OUTCOME = 'OUTCOME',
}
