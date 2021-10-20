import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, ManyToOne } from 'typeorm';
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

    @Column('bit', { nullable: false })
    isActive!: boolean;
}
