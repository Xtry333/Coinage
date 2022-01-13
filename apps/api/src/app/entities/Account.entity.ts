import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, ManyToOne, CreateDateColumn } from 'typeorm';
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

    @Column('bit', { name: 'is_active', nullable: false })
    private isActiveBuffer!: boolean;

    get isActive(): boolean {
        return !!this.isActiveBuffer;
    }

    set isActive(value: boolean) {
        this.isActiveBuffer = value;
    }

    @CreateDateColumn({ name: 'created_date', type: 'timestamp', nullable: true })
    createdDate!: Date;
}
