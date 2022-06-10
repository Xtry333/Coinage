import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { BooleanTransformer } from './transformers/boolean.transformer';
import { TimestampTransformer } from './transformers/timestamp.transformer';
import { User } from './User.entity';

@Entity()
@Unique(['name', 'userId'])
export class Account {
    public constructor() {
        this.createdDate = new Date();
    }

    @PrimaryGeneratedColumn()
    public id!: number;

    @Column('varchar', { length: 50, nullable: false })
    public name!: string;

    @Column('number', { nullable: false })
    public userId!: number;

    @ManyToOne(() => User, { eager: true, nullable: false, onUpdate: 'RESTRICT', onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'user_id' })
    public user!: User;

    @Column('bit', { name: 'is_active', nullable: false, default: true, transformer: new BooleanTransformer() })
    public isActive!: boolean;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp', nullable: false, transformer: new TimestampTransformer() })
    public readonly createdDate!: Date;
}
