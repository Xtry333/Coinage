import { Injectable } from '@nestjs/common';
import { Equal, getConnection } from 'typeorm';
import { Transfer } from './entity/Transfer.entity';

@Injectable()
export class AppService {
    async getTransfers(): Promise<Transfer[]> {
        const tr = await getConnection()
            .getRepository(Transfer)
            .find({ order: { date: 'ASC' } });
        for (const transfer of tr) {
            await transfer.category.parent;
        }
        return tr;
    }

    async getTransfer(id: number): Promise<Transfer> {
        const transfer = await getConnection()
            .getRepository(Transfer)
            .findOne({ where: { id: Equal(id) } });
        await transfer.category.parent;
        return transfer;
    }
}
