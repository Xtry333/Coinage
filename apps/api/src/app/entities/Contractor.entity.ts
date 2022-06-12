import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { BooleanTransformer } from './transformers/boolean.transformer';

@Entity()
export class Contractor {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ type: 'varchar', length: 50, nullable: false })
    public name!: string;

    @Column({ type: 'bit', default: "b'1'", nullable: false, transformer: new BooleanTransformer() })
    public isActive!: string;
}
