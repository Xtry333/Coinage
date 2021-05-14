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
        if (!transfer) {
            throw new Error('Transfer not found');
        }
        await transfer.category.parent;
        return transfer;
    }

    async getTransferByDateContractor(
        date: string,
        contractorId: number
    ): Promise<Transfer[]> {
        const transfers = await getConnection()
            .getRepository(Transfer)
            .find({
                where: { date: Equal(date), contractor: Equal(contractorId) },
            });
        return transfers;
    }

    async getCategories(): Promise<Category[]> {
        return await getConnection().getTreeRepository(Category).find();
    }
}
