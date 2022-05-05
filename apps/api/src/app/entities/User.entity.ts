import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Account } from './Account.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('text', { nullable: false })
    name!: string;

    @OneToMany(() => Account, (account) => account.user, { eager: false, cascade: true })
    accounts!: Promise<Account[]>;
}
