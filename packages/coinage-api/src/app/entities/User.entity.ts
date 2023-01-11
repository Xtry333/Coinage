import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn } from 'typeorm';
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

    @OneToMany(() => Account, (account) => account.user)
    public accounts!: Promise<Account[]>;

    @CreateDateColumn({ type: 'timestamp', nullable: false, transformer: new TimestampTransformer() })
    public readonly createdDate!: Date;
}
