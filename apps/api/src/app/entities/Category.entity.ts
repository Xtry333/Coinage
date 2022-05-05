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
    id!: number;

    @Column('varchar', { length: 50, nullable: false })
    name!: string;

    @Column('text', { nullable: true })
    description!: string | null;

    @Column('varchar', { length: 50, nullable: false })
    type!: TransferTypeEnum;

    @Column({ nullable: true })
    parentId?: number | null;

    @ManyToOne(() => Category, { nullable: true })
    @JoinColumn({ name: 'parent_id' })
    parent!: Promise<Category | null>;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'user_id' })
    user!: Promise<User | null>;

    @OneToMany(() => Category, (category) => category.parent, {})
    children!: Promise<Category[]>;

    @Column('text', { nullable: true })
    tag!: string | null;
}
