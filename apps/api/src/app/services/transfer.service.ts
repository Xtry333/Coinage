import { Injectable } from '@angular/core';
import { DeleteResult, Equal, getConnection, InsertResult } from 'typeorm';
import { Transfer } from '../entity/Transfer.entity';

@Injectable({
    providedIn: 'root',
})
export class TransferService {
    async getById(id: number): Promise<Transfer> {
        const transfer = await getConnection()
            .getRepository(Transfer)
            .findOne({ where: { id: Equal(id) } });
        if (!transfer) {
            throw new Error('Transfer not found');
        }
        await transfer.category.parent;
        return transfer;
    }

    async getLimitedTotalOutcomes(): Promise<{ year: number; month: number; amount: string; count: number }[]> {
        return await getConnection()
            .getRepository(Transfer)
            .query(
                "SELECT YEAR(DATE) AS `year`, MONTH(DATE) AS `month`, SUM(amount) AS `amount`, COUNT(id) AS `count` FROM transfer WHERE TYPE = 'OUTCOME' GROUP BY YEAR(date), MONTH(DATE) ORDER BY `year` DESC, `month` DESC LIMIT 12"
            );
    }

    async insert(transfer: Transfer): Promise<InsertResult> {
        return await getConnection().getRepository(Transfer).insert(transfer);
    }

    async save(transfer: Transfer): Promise<Transfer> {
        return await getConnection().getRepository(Transfer).save(transfer);
    }

    async deleteById(id: number): Promise<DeleteResult> {
        return await getConnection()
            .getRepository(Transfer)
            .delete({ id: Equal(id) });
    }
}
