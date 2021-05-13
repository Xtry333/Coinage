import { Injectable } from '@nestjs/common';
import { Equal, getConnection } from 'typeorm';
import { Category } from './entity/Category.entity';
import { Transfer } from './entity/Transfer.entity';

@Injectable()
export class AppService {
    async getTransfers(): Promise<Transfer[]> {
        const tr = await getConnection()
            .getRepository(Transfer)
            .find({ order: { date: 'DESC', id: 'DESC' }, take: 10 });
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

    async getCategories(): Promise<Category[]> {
        return await getConnection().getTreeRepository(Category).find();
    }
}
