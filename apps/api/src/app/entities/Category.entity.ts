import { TransferTypeEnum } from '@coinage-app/interfaces';
import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

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
    description?: string | null;

    @Column('varchar', { length: 50, nullable: false })
    type!: TransferTypeEnum;

    @Column({ name: 'parent', nullable: true })
    parentId!: number | null;

    @ManyToOne('Category', { nullable: true })
    @JoinColumn({ name: 'parent' })
    parent!: Promise<Category | null>;

    @OneToMany('Category', 'parent', {})
    children!: Promise<Category[] | null>;

    @Column('text', { nullable: true })
    tag?: string | null;
}
