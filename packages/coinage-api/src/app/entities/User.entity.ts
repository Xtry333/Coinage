import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Account } from './Account.entity';
import { TimestampTransformer } from './transformers/timestamp.transformer';

@Entity()
export class User {
    public constructor() {
        this.createdDate = new Date();
    }

    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ type: 'varchar', length: 50, nullable: false })
    public name!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    public password?: string;

    @OneToMany(() => Account, (account) => account.user)
    public accounts!: Promise<Account[]>;

    @Column({ type: 'boolean', name: 'is_system_user', nullable: false, default: false })
    public isSystemUser!: boolean;

    @CreateDateColumn({ type: 'timestamp', nullable: false, transformer: new TimestampTransformer() })
    public readonly createdDate!: Date;
}
