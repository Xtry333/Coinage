import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Timestamp } from 'typeorm';
import { DateTransformer, DateTransformerType } from './transformers/date.transformer';

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

    @ManyToOne('User', { eager: true, nullable: false })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column('bit', { name: 'is_active', nullable: false, transformer: new BooleanTransformer() })
    isActive!: boolean;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp', nullable: true, transformer: new TimestampTransformer() })
    createdDate!: Date;
}
