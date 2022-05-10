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

    @Column('text', { nullable: false })
    public name!: string;

    @OneToMany(() => Account, (account) => account.user, { eager: false, cascade: true })
    public accounts!: Promise<Account[]>;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp', nullable: false, transformer: new TimestampTransformer() })
    public readonly createdDate!: Date;
}
