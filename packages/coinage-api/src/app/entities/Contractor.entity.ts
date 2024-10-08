import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { BooleanTransformer } from './transformers/boolean.transformer';
import { Bit } from '../constants/booleanBuffer.const';

@Entity()
export class Contractor {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ type: 'varchar', length: 50, nullable: false })
    public name!: string;

    @Column({ type: 'bit', nullable: false, default: Bit.True, transformer: new BooleanTransformer() })
    public isActive!: boolean;
}
