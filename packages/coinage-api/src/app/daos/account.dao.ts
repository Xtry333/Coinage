import { DeleteResult, Equal, Repository, DataSource, In } from 'typeorm';

import { Account } from '../entities/Account.entity';
import { BalanceDTO } from '@coinage-app/interfaces';
import { DateParserService } from '../services/date-parser.service';
import { Injectable } from '@nestjs/common';
import { TransferType } from '../entities/Category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Transfer } from '../entities/Transfer.entity';
import { BaseDao } from './base.dao';
import { AccountSubBalance } from './daoDtos/AccountSubBalance.dto';
import { DatabaseSourceService } from '../services/database-source.service';
import { AccountMonthlySubChange } from './daoDtos/AccountMonthlySubBalance.dto';

@Injectable()
export class AccountDao extends BaseDao {
    public constructor(
        @InjectRepository(Account) private readonly accountRepository: Repository<Account>,
        private readonly dateParser: DateParserService,
        private readonly dataSource: DataSource,
        private readonly databaseSourceService: DatabaseSourceService
    ) {
        super();
    }

    public async getById(id: number): Promise<Account> {
        const account = await this.accountRepository.findOneBy({ id: Equal(id) });

        return this.validateNotNullById(Account.name, id, account);
    }

    public async getByIds(ids: number[]): Promise<Account[]> {
        return await this.accountRepository.findBy({ id: In(ids) });
    }

    public async countAllTransfersForAccount(id: number): Promise<number> {
        const result = await this.accountRepository
            .createQueryBuilder()
            .select('COUNT(t.id)', 'count')
            .from(Transfer, 't')
            .where({ accountId: Equal(id) })
            .orWhere({ targetAccountId: Equal(id) })
            .getRawOne();
        return parseInt(result[0].count, 10);
    }

    public getAllActive(): Promise<Account[]> {
        return this.accountRepository.find({ where: { isActive: true } });
    }

    public getForUserId(userId: number): Promise<Account[]> {
        return this.accountRepository.find({ where: { userId: Equal(userId) } });
    }

    public getCurrentlyActiveForUserId(userId: number): Promise<Account[]> {
        return this.accountRepository.find({ where: { userId: Equal(userId), isActive: true } });
    }

    public save(account: Account): Promise<Account> {
        return this.dataSource.getRepository(Account).save(account);
    }

    public deleteById(id: number): Promise<DeleteResult> {
        return this.dataSource.getRepository(Account).delete({ id: Equal(id) });
    }

    public getAccountBalance(accountIds: number[]): Promise<BalanceDTO[]> {
        return this.getAccountBalanceForAccountAsOfDate(accountIds, new Date());
    }

    public async getAccountBalanceForAccountAsOfDate(accountIds: number[], asOfDate: Date): Promise<BalanceDTO[]> {
        const result = await this.dataSource.query(`
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
        const result = await this.dataSource.query(`
                SELECT a.id, a.name,
                SUM(CASE WHEN t.type = '${TransferType.Income}' THEN t.amount WHEN t.type = '${TransferType.Outcome}' THEN -t.amount ELSE 0 END) AS balance,
                COUNT(t.id) AS transfer_count
                FROM account a
                LEFT JOIN transfer t
                ON t.account_id = a.id AND t.date = '${this.dateParser.formatMySql(asOfDate)}' #AND t.is_internal = 0
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
        return await this.dataSource.getRepository(Transfer).query(
            `SELECT
                    YEAR(t.date) AS 'year',
                    MONTH(t.date) AS 'month',
                    SUM(CASE WHEN t.type = '${TransferType.Income}' THEN t.amount ELSE 0 END) AS 'income',
                    SUM(CASE WHEN t.type = '${TransferType.Outcome}' THEN t.amount ELSE 0 END) AS 'outcome',
                    COUNT(t.id) AS 'count'
                FROM transfer AS t
                WHERE t.account_id IN (${accountIds.join(',')})
                    AND t.date <= '${this.dateParser.getToday()}' ${sumOnlyInternalTransfers ? `#AND t.is_internal = 0` : ``}
                GROUP BY YEAR(t.date), MONTH(t.date)
                ORDER BY year DESC, month DESC
                LIMIT 12`
        );
    }

    public async getMonthlySubChangeForUserId(userId: number, numberOfLastMonths = 12) {
        return await this.databaseSourceService.queryWithParams(
            `
SELECT
    YEAR(t.date) AS 'changeYear',
    MONTH(t.date) AS 'changeMonth',
    oa.id AS 'originAccountId',
    ta.id AS 'targetAccountId',
    SUM(IFNULL(t.amount, 0)) AS 'monthlySubChange',
    oa.user_id = ta.user_id AS 'isInternal',
    COUNT(t.id) AS 'transferCount'
FROM transfer AS t
LEFT JOIN account AS oa ON oa.id = t.account_id
LEFT JOIN account AS ta ON ta.id = t.target_account_id
WHERE (oa.user_id = :userId OR ta.user_id = :userId)
    AND t.date <= NOW()
    AND t.date >= DATE_SUB(NOW(), INTERVAL (:monthsCount + 1) MONTH)
GROUP BY YEAR(t.date), MONTH(t.date), oa.id, ta.id
ORDER BY changeYear DESC, changeMonth DESC
#LIMIT 12
        `,
            { userId: userId, monthsCount: numberOfLastMonths },
            AccountMonthlySubChange
        );
    }

    public async getLastTransferDate(accountId: number): Promise<string> {
        const result = await this.dataSource.query(`SELECT t.date FROM transfer t WHERE t.account_id = ${accountId} ORDER BY t.date DESC LIMIT 1;`);
        return result[0].date;
    }

    public async getSubBalanceByFilter(filter: { accountIds?: number[]; userId?: number }, asOfDate?: Date): Promise<AccountSubBalance[]> {
        const asOfDateString = asOfDate ? this.dateParser.formatMySql(asOfDate) : this.dateParser.getToday();
        return await this.databaseSourceService.queryWithParams(
            `
            SELECT
                oa.id AS 'fromAccountId',
                oa.name AS 'fromAccountName',
                ta.id AS 'toAccountId',
                ta.name AS 'toAccountName',
                SUM(t.amount) AS 'subBalance',
                oa.user_id AS 'fromUserId',
                ta.user_id AS 'toUserId',
                oa.user_id = ta.user_id AS 'isInternalTransfer'
            FROM transfer AS t
            LEFT JOIN account oa ON t.account_id = oa.id
            LEFT JOIN account ta ON t.target_account_id = ta.id
            WHERE t.date <= :asOfDate
                ${filter.accountIds ? `AND (oa.id IN (:accountIds) OR ta.id IN (:accountIds))` : ``}
                ${filter.userId ? `AND (oa.user_id = :userId OR ta.user_id = :userId)` : ``}
            GROUP BY oa.id, ta.id;
            `,
            { accountIds: filter.accountIds, asOfDate: asOfDateString, userId: filter.userId },
            AccountSubBalance
        );
    }

    public async getBalanceNew(
        filter: { accountIds?: number[]; userId?: number },
        asOfDate?: Date
    ): Promise<
        {
            accountId: number;
            accountName: string;
            currencySymbol: string;
            balance: string;
            userId: number;
        }[]
    > {
        const asOfDateString = asOfDate ? this.dateParser.toUTCString(asOfDate) : this.dateParser.getToday();
        const query = this.dataSource.driver.escapeQueryWithParameters(
            `
            SELECT
                oa.id AS 'accountId',
                oa.name AS 'accountName',
                c.symbol AS 'currencySymbol',
                (
                    (SELECT
                        IFNULL(SUM(ot.amount), 0)
                    FROM transfer ot
                    WHERE ot.target_account_id = oa.id
                        AND ot.currency_symbol = currencySymbol
                        AND ot.date <= :asOfDate)
                    - SUM(IFNULL(t.amount, 0))
                ) AS 'balance',
                oa.user_id AS 'userId'
            FROM account AS oa
            LEFT JOIN currency AS c ON oa.currency_symbol = c.symbol
            LEFT JOIN transfer AS t ON t.account_id = oa.id
            #LEFT JOIN account ta ON t.target_account_id = ta.id
            WHERE (t.date <= :asOfDate OR t.date IS NULL)
                ${filter.accountIds ? `AND oa.id IN (:accountIds)` : ``}
                ${filter.userId ? `AND oa.user_id = :userId` : ``}
            GROUP BY oa.id, oa.currency_symbol
        `,
            { accountIds: filter.accountIds, asOfDate: asOfDateString, userId: filter.userId },
            {}
        );
        return await this.dataSource.query(...query);
    }
}
