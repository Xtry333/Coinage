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
    description?: string;

    @Column({ name: 'parent' })
    parentId!: number;

    @Column('varchar', { length: 50, nullable: false })
    type!: string;

    @ManyToOne('Category', { nullable: true })
    @JoinColumn({ name: 'parent' })
    parent!: Promise<Category>;

    @OneToMany('Category', 'parent', {})
    children!: Promise<Category[]>;
}
