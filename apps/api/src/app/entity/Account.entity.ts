import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Account {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('text', { nullable: false })
    name!: string;
}
