import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Container {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ type: 'varchar', length: 64, nullable: true })
    public name!: string | null;

    @Column({ type: 'float', nullable: true })
    public weight!: number | null;

    @Column({ type: 'varchar', length: 8, nullable: true })
    public weightUnit!: string | null;

    @Column({ type: 'float', nullable: true })
    public volume!: number | null;

    @Column({ type: 'varchar', length: 8, nullable: true })
    public volumeUnit!: string | null;
 
    @Column({ type: 'int', nullable: true })
    public itemCount!: number | null;
}
