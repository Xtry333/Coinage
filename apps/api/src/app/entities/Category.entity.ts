import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { TransferTypeEnum } from '@coinage-app/interfaces';
import { User } from './User.entity';

export enum TransferType {
    Income = 'INCOME',
    Outcome = 'OUTCOME',
}

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column('varchar', { length: 50, nullable: false })
    public name!: string;

    @Column('text', { nullable: true })
    public description!: string | null;

    @Column('varchar', { length: 50, nullable: false })
    public type!: TransferTypeEnum;

    @Column({ nullable: true })
    public parentId?: number | null;

    @ManyToOne(() => Category, { nullable: true })
    @JoinColumn({ name: 'parent_id' })
    public parent!: Promise<Category | null>;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'user_id' })
    public user!: Promise<User | null>;

    @OneToMany(() => Category, (category) => category.parent, {})
    public children!: Promise<Category[]>;

    @Column('text', { nullable: true })
    public tag!: string | null;
}
