import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { User } from './User.entity';

export enum TransferType {
    Income = 'INCOME',
    Outcome = 'OUTCOME',
}

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column('varchar', { length: 50, nullable: false, unique: true })
    public name!: string;

    @Column('text', { nullable: true })
    public description!: string | null;

    @Column({ name: 'type', type: 'enum', enum: ['INCOME', 'OUTCOME'], nullable: false })
    public type!: TransferTypeEnum;

    @Column({ nullable: true })
    public parentId?: number | null;

    @ManyToOne(() => Category, { nullable: true, onUpdate: 'CASCADE', onDelete: 'SET NULL' })
    @JoinColumn({ name: 'parent_id' })
    public parent!: Promise<Category | null>;

    @ManyToOne(() => User, { nullable: true, onUpdate: 'CASCADE', onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'user_id' })
    public user!: Promise<User | null>;

    @OneToMany(() => Category, (category) => category.parent, {})
    public children!: Promise<Category[]>;

    @Index()
    @Column('text', { nullable: true, unique: true })
    public tag!: string | null;
}

export enum TransferTypeEnum {
    INCOME = 'INCOME',
    OUTCOME = 'OUTCOME',
}
