import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Contractor } from './Contractor.entity';
import { Transfer } from './Transfer.entity';
import { DateTransformer, DateTransformerType } from './transformers/date.transformer';
import { DecimalToNumberTransformer } from './transformers/decimal-to-number.transformer';

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
}
