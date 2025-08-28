import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Currency {
    @PrimaryColumn({ type: 'varchar', length: 16, nullable: false })
    public symbol!: string;

    @Column({ type: 'varchar', length: 50, nullable: false })
    public name!: string;

    /*
     * Shorthand is a formatting `<code>% zł</code>` or `<code>$%</code>`
     */
    @Column({ type: 'varchar', length: 16, nullable: false })
    public shorthand!: string;
}
