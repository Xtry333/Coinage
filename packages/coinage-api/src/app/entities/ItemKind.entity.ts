import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class ItemKind {
    @PrimaryColumn({ type: 'varchar', length: 32 })
    public code!: string;

    @Column({ type: 'varchar', length: 64 })
    public name!: string;
}
