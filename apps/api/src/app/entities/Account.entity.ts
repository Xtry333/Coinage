import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { BooleanTransformer } from './transformers/boolean.transformer';
import { TimestampTransformer } from './transformers/timestamp.transformer';
import { User } from './User.entity';

@Entity()
export class Account {
    public constructor() {
        this.createdDate = new Date();
    }

    @PrimaryGeneratedColumn()
    public id!: number;

    @Column('text', { nullable: false })
    public name!: string;

    @Column('number', { nullable: false })
    public userId!: number;

    @ManyToOne(() => User, { eager: true, nullable: false })
    @JoinColumn({ name: 'user_id' })
    public user!: User;

    @Column('bit', { name: 'is_active', nullable: false, transformer: new BooleanTransformer() })
    public isActive!: boolean;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp', nullable: false, transformer: new TimestampTransformer() })
    public readonly createdDate!: Date;
}
