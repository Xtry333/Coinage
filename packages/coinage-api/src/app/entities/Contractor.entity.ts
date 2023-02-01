import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { BooleanTransformer } from './transformers/boolean.transformer';
import { BitFalse, BitTrue } from '../constants/booleanBuffer.const';

@Entity()
export class Contractor {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ type: 'varchar', length: 50, nullable: false })
    public name!: string;

    @Column({ type: 'bit', nullable: false, default: BitTrue, transformer: new BooleanTransformer() })
    public isActive!: boolean;
}
