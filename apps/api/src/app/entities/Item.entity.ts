import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { DateTransformer, DateTransformerType } from './transformers/date.transformer';

@Entity()
export class Item {
    public constructor() {
        this.editedDate = new Date();
        this.createdDate = new Date();
    }

    @PrimaryGeneratedColumn()
    public id!: number;

    @Column('text', { nullable: false })
    public name!: string;

    @UpdateDateColumn({ name: 'edited_date', type: 'timestamp', nullable: false, transformer: new DateTransformer(DateTransformerType.DATETIME) })
    public readonly editedDate!: Date;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp', nullable: false, transformer: new DateTransformer(DateTransformerType.DATETIME) })
    public readonly createdDate!: Date;
}
