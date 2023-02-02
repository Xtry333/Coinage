import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Bit } from '../constants/booleanBuffer.const';
import { Contractor } from './Contractor.entity';

import { BooleanTransformer } from './transformers/boolean.transformer';
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

    @Column({ name: 'currency_symbol', type: 'varchar', length: 5, nullable: false })
    public currencySymbol!: string;

    @Column({ nullable: true })
    public userId!: number;

    @ManyToOne(() => User, { eager: true, onUpdate: 'RESTRICT', onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'user_id' })
    public user!: User;

    @Column({ type: 'bit', name: 'is_contractor_account', nullable: false, default: Bit.False, transformer: new BooleanTransformer() })
    public isContractorAccount!: boolean;

    @Column({ type: 'bit', name: 'is_active', nullable: false, default: Bit.True, transformer: new BooleanTransformer() })
    public isActive!: boolean;

    @CreateDateColumn({ type: 'timestamp', nullable: false, transformer: new TimestampTransformer() })
    public readonly createdDate!: Date;
}
