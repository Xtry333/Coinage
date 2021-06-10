import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Contractor {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('varchar', { length: 50, nullable: false })
    name!: string;
}
