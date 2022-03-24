import { GetFilteredTransfersRequest, Range } from '@coinage-app/interfaces';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DeleteResult, Equal, FindConditions, getConnection, ILike, In, InsertResult, LessThanOrEqual, Repository } from 'typeorm';
import { TransferType } from '../entities/Category.entity';
import { Transfer } from '../entities/Transfer.entity';

type KeysOfType<O, T> = {
    [P in keyof Required<O>]: Required<O>[P] extends T ? P : never;
}[keyof O];

@Injectable()
export class TransferDao {
    constructor(
        @InjectRepository(Transfer)
        private readonly transferRepository: Repository<Transfer>
    ) {}

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

    public getAll() {
        return getConnection()
            .getRepository(Transfer)
            .find({ order: { date: 'DESC', id: 'DESC' } });
    }

    public getAllFilteredPaged(params: GetFilteredTransfersRequest): Promise<Transfer[]> {
        const filter = this.createFilteredFindConditions(params);

        return getConnection()
            .getRepository(Transfer)
            .find({ where: filter, order: { date: 'DESC', id: 'DESC' }, take: params.rowsPerPage, skip: params.rowsPerPage * (params.page - 1) });
    }

    public getAllFilteredCount(params: GetFilteredTransfersRequest): Promise<number> {
        const filter = this.createFilteredFindConditions(params);

        return getConnection()
            .getRepository(Transfer)
            .count({ where: filter, order: { date: 'DESC', id: 'DESC' } });
    }

    private createFilteredFindConditions(params: GetFilteredTransfersRequest): FindConditions<Transfer> {
        const filter: FindConditions<Transfer> = {};

        this.assignInFilterIfExists(filter, 'contractorId', params.contractorIds);
        this.assignInFilterIfExists(filter, 'accountId', params.accountIds);
        this.assignInFilterIfExists(filter, 'categoryId', params.categoryIds);
        this.assignInFilterIfExists(filter, 'id', params.transferIds);
        this.assignBetweenFilterIfExists(filter, 'date', params.date);
        this.assignBetweenFilterIfExists(filter, '_amount', params.amount);

        if (params.description) {
            filter.description = ILike(`%${params.description}%`);
        }

        if (!params.showPlanned) {
            filter.date = LessThanOrEqual(this.getToday());
        }

        return filter;
    }

    private assignInFilterIfExists(filter: FindConditions<Transfer>, key: KeysOfType<Transfer, number | null>, values?: number[]) {
        if (values && values.length > 0) {
            filter[key] = In(values);
        }
    }

    private assignBetweenFilterIfExists(
        filter: FindConditions<Transfer>,
        key: KeysOfType<Transfer, string | number | null>,
        range?: Range<string | number | null>
    ) {
        if (range !== undefined && range.from !== undefined && range.to !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (filter as any)[key] = Between(range.from, range.to);
        }
    }

    public getRecentlyEditedTransfersForUser(userId: number, count?: number): Promise<Transfer[]> {
        return getConnection()
            .createQueryBuilder(Transfer, 'transfer')
            .select()
            .leftJoinAndSelect('transfer.account', 'account')
            .leftJoinAndSelect('transfer.category', 'category')
            .leftJoinAndSelect('transfer.contractor', 'contractor')
            .leftJoinAndSelect('account.user', 'user')
            .orderBy('transfer.editedDate', 'DESC')
            .addOrderBy('transfer.id', 'DESC')
            .where('user.id = :userId', { userId })
            .take(count)
            .getMany();
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

    public async deleteEthereals(): Promise<number> {
        return (await this.transferRepository.delete({ isEthereal: Equal(true) })).affected ?? 0;
    }

    private getToday(): string {
        const date = new Date();
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }
}
