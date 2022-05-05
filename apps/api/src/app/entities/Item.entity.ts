import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { DateTransformer, DateTransformerType } from './transformers/date.transformer';

@Entity()
export class Item {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('text', { nullable: false })
    name!: string;

    @UpdateDateColumn({ name: 'edited_date', type: 'timestamp', nullable: false, transformer: new DateTransformer(DateTransformerType.DATETIME) })
    editedDate!: Date;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp', nullable: false, transformer: new DateTransformer(DateTransformerType.DATETIME) })
    readonly createdDate!: Date;
}
