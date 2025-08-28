import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Transfer } from './Transfer.entity';
import { DateTransformer, DateTransformerType } from './transformers/date.transformer';
import { WithDateEntity } from './WithDate.partialEntity';

export enum ScheduleRecurrenceEnum {
    DAILY = 'DAILY',
    WEEKLY = 'WEEKLY',
    MONTHLY = 'MONTHLY',
    YEARLY = 'YEARLY',
    CUSTOM = 'CUSTOM',
}

@Entity()
export class Schedule extends WithDateEntity {
    public constructor() {
        super();
        this.metadata = {};
    }

    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ type: 'text', nullable: false })
    public name!: string;

    @Column({ type: 'enum', enum: ScheduleRecurrenceEnum, default: ScheduleRecurrenceEnum.MONTHLY, nullable: false })
    public recurrence!: ScheduleRecurrenceEnum;

    @Column({ type: 'timestamp', nullable: false, transformer: new DateTransformer(DateTransformerType.DATETIME) })
    public startDate!: Date;

    @Column({ type: 'int', nullable: false })
    public count!: number;

    @OneToMany(() => Transfer, (transfer) => transfer.schedule, { eager: false })
    public transfers!: Promise<Transfer[]>;

    @Column({ type: 'json', nullable: true })
    public metadata!: { [key: string]: string | number | undefined } | null;
}
