import { CreateDateColumn, UpdateDateColumn } from 'typeorm';

import { DateTransformer, DateTransformerType } from './transformers/date.transformer';

export class WithDateEntity {
    public constructor() {
        this.editedDate = new Date();
        this.createdDate = new Date();
    }

    @UpdateDateColumn({ type: 'timestamp', nullable: false, transformer: new DateTransformer(DateTransformerType.DATETIME) })
    public readonly editedDate!: Date;

    @CreateDateColumn({ type: 'timestamp', nullable: false, transformer: new DateTransformer(DateTransformerType.DATETIME) })
    public readonly createdDate!: Date;
}
