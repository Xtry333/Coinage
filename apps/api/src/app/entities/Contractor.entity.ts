import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Contractor {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column('varchar', { length: 50, nullable: false })
    public name!: string;
}
