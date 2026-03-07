import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Contractor } from './Contractor.entity';
import { Transfer } from './Transfer.entity';
import { DateTransformer, DateTransformerType } from './transformers/date.transformer';
import { DecimalToNumberTransformer } from './transformers/decimal-to-number.transformer';

export enum ReceiptProcessingStatus {
    NONE = 'NONE',
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    PROCESSED = 'PROCESSED',
    DUPLICATE = 'DUPLICATE',
    ERROR = 'ERROR',
}

@Entity()
export class Receipt {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ type: 'text', nullable: true })
    public description!: string | null;

    @Column({ type: 'decimal', precision: 20, scale: 2, nullable: false, transformer: new DecimalToNumberTransformer(2) })
    public amount!: number;

    @Column({ type: 'date', nullable: true, transformer: new DateTransformer(DateTransformerType.DATE) })
    public date!: Date | null;

    @Column({ nullable: true })
    public contractorId?: number | null;

    @ManyToOne(() => Contractor, { eager: true, nullable: true, onUpdate: 'CASCADE', onDelete: 'SET NULL' })
    @JoinColumn({ name: 'contractor_id' })
    public contractor?: Contractor | null;

    @OneToMany(() => Transfer, (transfer) => transfer.receipt, { eager: true })
    public transfers!: Transfer[];

    @Column({ name: 'image_path', type: 'varchar', length: 500, nullable: true, default: null })
    public imagePath!: string | null;

    @Column({ name: 'image_hash', type: 'varchar', length: 64, nullable: true, default: null })
    public imageHash!: string | null;

    @Column({
        name: 'processing_status',
        type: 'enum',
        enum: ReceiptProcessingStatus,
        default: ReceiptProcessingStatus.NONE,
        nullable: false,
    })
    public processingStatus!: ReceiptProcessingStatus;

    @Column({ name: 'ai_extracted_data', type: 'json', nullable: true, default: null })
    public aiExtractedData!: object | null;
}
