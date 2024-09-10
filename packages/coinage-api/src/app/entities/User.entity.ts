import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn } from 'typeorm';

import { Account } from './Account.entity';
import { BooleanTransformer } from './transformers/boolean.transformer';
import { TimestampTransformer } from './transformers/timestamp.transformer';
import { Bit } from '../constants/booleanBuffer.const';

@Entity()
export class User {
    public constructor() {
        this.createdDate = new Date();
    }

    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ type: 'varchar', length: 50, nullable: false })
    public name!: string;

    @Column({ type: 'varchar', length: 64, nullable: true })
    public password?: string;

    @OneToMany(() => Account, (account) => account.user)
    public accounts!: Promise<Account[]>;

    @Column({ type: 'bit', name: 'is_system_user', nullable: false, default: Bit.False, transformer: new BooleanTransformer() })
    public isSystemUser!: boolean;

    @CreateDateColumn({ type: 'timestamp', nullable: false, transformer: new TimestampTransformer() })
    public readonly createdDate!: Date;
}
