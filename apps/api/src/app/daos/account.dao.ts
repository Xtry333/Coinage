import { DeleteResult, Equal, Repository, getConnection } from 'typeorm';

import { Account } from '../entities/Account.entity';
import { BalanceDTO } from '@coinage-app/interfaces';
import { DateParserService } from '../services/date-parser.service';
import { Injectable } from '@nestjs/common';
import { TransferType } from '../entities/Category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Transfer } from '../entities/Transfer.entity';
import { BaseDao } from './base.bao';

@Injectable()
export class AccountDao extends BaseDao {
    public constructor(@InjectRepository(Account) private readonly accountRepository: Repository<Account>, private readonly dateParser: DateParserService) {
        super();
    }

    public async getById(id: number): Promise<Account> {
        const account = await this.accountRepository.findOneBy({ id: Equal(id) });

        return this.validateNotNullById(Account.name, id, account);
    }

    public async getByIds(ids: number[]): Promise<Account[]> {
        return await this.accountRepository.findByIds(ids);
    }

    public async countAllTransfersForAccount(id: number): Promise<number> {
        const result = await this.accountRepository
            .createQueryBuilder()
            .select('COUNT(t.id)', 'count')
            .from(Transfer, 't')
            .where({ accountId: Equal(id) })
            .getRawOne();
        return parseInt(result[0].count, 10);
    }

    public getAllActive(): Promise<Account[]> {
        return this.accountRepository.find({ where: { isActive: Equal(true) } });
    }

    public getForUserId(userId: number): Promise<Account[]> {
        return this.accountRepository.find({ where: { userId: Equal(userId) } });
    }

    public getCurrentlyActiveForUserId(userId: number): Promise<Account[]> {
        return this.accountRepository.find({ where: { userId: Equal(userId), isActive: Equal(true) } });
    }

    public save(account: Account): Promise<Account> {
        return getConnection().getRepository(Account).save(account);
    }

    public deleteById(id: number): Promise<DeleteResult> {
        return getConnection()
            .getRepository(Account)
            .delete({ id: Equal(id) });
    }

    public getAccountBalance(accountIds: number[]): Promise<BalanceDTO[]> {
        return this.getAccountBalanceForAccountAsOfDate(accountIds, new Date());
    }

    public async getAccountBalanceForAccountAsOfDate(accountIds: number[], asOfDate: Date): Promise<BalanceDTO[]> {
        const result = await getConnection().query(`
                SELECT t.account_id AS accountId, a.name, 
                SUM(CASE WHEN t.type = '${TransferType.Income}' THEN t.amount WHEN t.type = '${TransferType.Outcome}' THEN -t.amount ELSE 0 END) AS balance
                FROM transfer t
                JOIN account a ON t.account_id = a.id
                WHERE t.date <= '${this.dateParser.formatMySql(asOfDate)}' AND a.id IN (${accountIds.join(',')})
                GROUP BY t.account_id;`);
        return result.map((r: { accountId: number; name: string; balance: string }) => {
            return {
                accountId: r.accountId,
                name: r.name,
                balance: parseFloat(r.balance),
            };
        });
    }

    public async getSpendingsAsOfDate(accountIds: number[], asOfDate: Date, userId: number): Promise<BalanceDTO[]> {
        const result = await getConnection().query(`
                SELECT a.id, a.name,
                SUM(CASE WHEN t.type = '${TransferType.Income}' THEN t.amount WHEN t.type = '${TransferType.Outcome}' THEN -t.amount ELSE 0 END) AS balance,
                COUNT(t.id) AS transfer_count
                FROM account a
                LEFT JOIN transfer t
                ON t.account_id = a.id AND t.date = '${this.dateParser.formatMySql(asOfDate)}' AND t.is_internal = 0
                WHERE a.id IN (${accountIds.join(',')}) AND a.user_id = ${userId} AND t.type = '${TransferType.Outcome}'
                GROUP BY a.id;`);
        return result.map((r: { id: number; name: string; balance: string }) => {
            return {
                accountId: r.id,
                name: r.name,
                balance: parseFloat(r.balance),
            };
        });
    }

    public async getLast12MonthStats(
        accountIds: number[],
        sumOnlyInternalTransfers = true
    ): Promise<{ year: number; month: number; income: string; outcome: string; count: string }[]> {
        return await getConnection()
            .getRepository(Transfer)
            .query(
                `SELECT
                    YEAR(t.date) AS 'year',
                    MONTH(t.date) AS 'month',
                    SUM(CASE WHEN t.type = '${TransferType.Income}' THEN t.amount ELSE 0 END) AS 'income',
                    SUM(CASE WHEN t.type = '${TransferType.Outcome}' THEN t.amount ELSE 0 END) AS 'outcome',
                    COUNT(t.id) AS 'count'
                FROM transfer AS t
                WHERE t.account_id IN (${accountIds.join(',')})
                    AND t.date <= '${this.dateParser.getToday()}' ${sumOnlyInternalTransfers ? `AND t.is_internal = 0` : ``}
                GROUP BY YEAR(t.date), MONTH(t.date)
                ORDER BY year DESC, month DESC
                LIMIT 12`
            );
    }

    public async getLastTransferDate(accountId: number): Promise<string> {
        const result = await getConnection().query(`SELECT t.date FROM transfer t WHERE t.account_id = ${accountId} ORDER BY t.date DESC LIMIT 1;`);
        return result[0].date;
    }
}
