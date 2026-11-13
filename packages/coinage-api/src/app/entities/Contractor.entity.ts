import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Contractor {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ type: 'varchar', length: 50, nullable: false })
    public name!: string;

    @Column({ type: 'boolean', nullable: false, default: true })
    public isActive!: boolean;
}
