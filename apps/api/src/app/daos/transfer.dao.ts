import { GetFilteredTransfersRequest } from '@coinage-app/interfaces';
import { Injectable } from '@nestjs/common';
import { Between, DeleteResult, Equal, FindConditions, getConnection, ILike, In, InsertResult, Like } from 'typeorm';
import { TransferType } from '../entities/Category.entity';
import { Transfer } from '../entities/Transfer.entity';

type KeysOfType<O, T> = {
    [P in keyof Required<O>]: Required<O>[P] extends T ? P : never;
}[keyof O];

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

    getAllFilteredPaged(params: GetFilteredTransfersRequest): Promise<Transfer[]> {
        const filter: FindConditions<Transfer> = {};
        this.assignNumericFilterIfExists(filter, 'contractorId', params.contractorIds);
        this.assignNumericFilterIfExists(filter, 'accountId', params.accountIds);
        this.assignNumericFilterIfExists(filter, 'categoryId', params.categoryIds);
        this.assignNumericFilterIfExists(filter, 'id', params.transferIds);
        this.assignBetweenIfExists(filter, 'date', params.dateFrom, params.dateTo);

        if (params.description) {
            filter.description = ILike(`%${params.description}%`);
        }

        return getConnection()
            .getRepository(Transfer)
            .find({ where: filter, order: { date: 'DESC', id: 'DESC' }, take: params.rowsPerPage, skip: params.rowsPerPage * (params.page - 1) });
    }

    getAllFilteredCount(params: GetFilteredTransfersRequest): Promise<number> {
        const filter: FindConditions<Transfer> = {};
        this.assignNumericFilterIfExists(filter, 'contractorId', params.contractorIds);
        this.assignNumericFilterIfExists(filter, 'accountId', params.accountIds);
        this.assignNumericFilterIfExists(filter, 'categoryId', params.categoryIds);
        this.assignNumericFilterIfExists(filter, 'id', params.transferIds);
        this.assignBetweenIfExists(filter, 'date', params.dateFrom, params.dateTo);

        if (params.description) {
            filter.description = ILike(`%${params.description}%`);
        }

        return getConnection()
            .getRepository(Transfer)
            .count({ where: filter, order: { date: 'DESC', id: 'DESC' } });
    }

    private assignNumericFilterIfExists(filter: FindConditions<Transfer>, key: KeysOfType<Transfer, number | null>, values?: number[]) {
        if (values && values.length > 0) {
            filter[key] = In(values);
        }
    }

    private assignBetweenIfExists(filter: FindConditions<Transfer>, key: keyof Transfer, a?: unknown, b?: unknown) {
        if (a && b) {
            (filter as any)[key] = Between(a, b);
        }
    }

    getAllLimited(count?: number) {
        return getConnection()
            .getRepository(Transfer)
            .find({ where: { accountId: 1 }, order: { date: 'DESC', id: 'DESC' }, take: count });
    }

    getRecent(accountIds: number[], count?: number) {
        return getConnection()
            .getRepository(Transfer)
            .find({ where: { accountId: In(accountIds) }, order: { editedDate: 'DESC', id: 'DESC' }, take: count });
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
                where: { date: Equal(date), contractorId: Equal(contractorId) },
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
