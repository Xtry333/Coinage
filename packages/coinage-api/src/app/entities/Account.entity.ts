import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Currency } from './Currency.entity';

import { TimestampTransformer } from './transformers/timestamp.transformer';
import { User } from './User.entity';

@Entity()
@Unique(['name', 'userId'])
export class Account {
    public constructor() {
        this.createdDate = new Date();
    }

    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ type: 'varchar', length: 50, nullable: false })
    public name!: string;

    @ManyToOne(() => Currency, { eager: true, nullable: false, onUpdate: 'RESTRICT', onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'currency_symbol' })
    public currency!: Currency;

    @Column({ nullable: true })
    public userId!: number;

    @ManyToOne(() => User, { eager: true, onUpdate: 'RESTRICT', onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'user_id' })
    public user!: User;

    @Column({ type: 'boolean', name: 'is_contractor_account', nullable: false, default: false })
    public isContractorAccount!: boolean;

    @Column({ type: 'boolean', name: 'is_active', nullable: false, default: true })
    public isActive!: boolean;

    @CreateDateColumn({ type: 'timestamp', nullable: false, transformer: new TimestampTransformer() })
    public readonly createdDate!: Date;
}
