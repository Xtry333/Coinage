import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { BooleanTransformer } from './transformers/boolean.transformer';
import { TimestampTransformer } from './transformers/timestamp.transformer';
import { User } from './User.entity';

@Entity()
export class Account {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('text', { nullable: false })
    name!: string;

    @Column('number', { nullable: false })
    userId!: number;

    @ManyToOne(() => User, { eager: true, nullable: false })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column('bit', { name: 'is_active', nullable: false, transformer: new BooleanTransformer() })
    isActive!: boolean;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp', nullable: false, transformer: new TimestampTransformer() })
    readonly createdDate!: Date;
}
