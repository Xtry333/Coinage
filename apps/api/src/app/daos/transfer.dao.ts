import { Injectable } from '@nestjs/common';
import { DeleteResult, Equal, getConnection, In, InsertResult } from 'typeorm';
import { TransferType } from '../entities/Category.entity';
import { Transfer } from '../entities/Transfer.entity';

@Injectable()
export class TransferDao {
    async getById(id: number): Promise<Transfer> {
        const transfer = await getConnection()
            .getRepository(Transfer)
            .findOne({
                where: { id: Equal(id) },
                join: {
                    alias: 'transfer',
                    leftJoinAndSelect: { receipt: 'transfer.receipt', contractor: 'receipt.contractor', transfers: 'receipt.transfers' },
                },
            });
        if (!transfer) {
            throw new Error('Transfer not found');
        }
        await transfer.category.parent;
        return transfer;
    }

    getAll() {
        return getConnection()
            .getRepository(Transfer)
            .find({ order: { date: 'DESC', id: 'DESC' } });
    }

    getAllLimited(count?: number) {
        return getConnection()
            .getRepository(Transfer)
            .find({ where: { accountId: 1 }, order: { date: 'DESC', id: 'DESC' }, take: count });
    }

    getRecent(count?: number) {
        return getConnection()
            .getRepository(Transfer)
            .find({ where: { accountId: In([1, 4, 5, 6]) }, order: { editedDate: 'DESC', id: 'DESC' }, take: count });
    }

    async getLimitedTotalMonthlyAmount(accountIds: number[], type: TransferType): Promise<{ year: number; month: number; amount: string; count: number }[]> {
        return await getConnection()
            .getRepository(Transfer)
            .query(
                `SELECT YEAR(DATE) AS \`year\`, MONTH(DATE) AS \`month\`, SUM(amount) AS \`amount\`, COUNT(id) AS \`count\` 
                FROM transfer 
                WHERE TYPE = '${type}' AND \`account_id\` IN (${accountIds.join(',')}) AND \`date\` <= '${this.getToday()}' AND is_internal = 0 
                GROUP BY YEAR(date), MONTH(DATE) ORDER BY \`year\` DESC, \`month\` DESC LIMIT 12`
            );
    }

    async getTransferByDateContractor(date: string, contractorId: number): Promise<Transfer[]> {
        const transfers = await getConnection()
            .getRepository(Transfer)
            .find({
                where: { date: Equal(date), contractor: Equal(contractorId) },
            });
        return transfers;
    }

    async getByCategory(categoryId: number) {
        const transfers = await getConnection()
            .getRepository(Transfer)
            .find({
                where: { categoryId: Equal(categoryId) },
            });
        return transfers;
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

    private getToday(): string {
        const date = new Date();
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }
}
