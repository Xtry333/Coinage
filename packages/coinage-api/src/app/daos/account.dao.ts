import { plainToInstance } from 'class-transformer';
import { DeleteResult, Equal, Repository, DataSource, In } from 'typeorm';

import { Account } from '../entities/Account.entity';
import { BalanceDTO } from '@app/interfaces';
import { DateParserService } from '../services/date-parser.service';
import { Injectable } from '@nestjs/common';
import { TransferType } from '../entities/Category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Transfer } from '../entities/Transfer.entity';
import { BaseDao } from './base.dao';
import { AccountSubBalance } from './daoDtos/AccountSubBalance.dto';
import { DatabaseSourceService } from '../services/database-source.service';
import { AccountMonthlySubChange } from './daoDtos/AccountMonthlySubBalance.dto';
import { SingularAccountDailyBalance } from './daoDtos/SingularAccountDailyBalance.dto';

@Injectable()
export class AccountDao extends BaseDao {
    public constructor(
        @InjectRepository(Account) private readonly accountRepository: Repository<Account>,
        private readonly dateParser: DateParserService,
        private readonly dataSource: DataSource,
        private readonly databaseSourceService: DatabaseSourceService,
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
            .getRawOne<{ count: string | number }>();
        return Number(result?.count ?? 0);
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

    public getSingularAccountDailyBalance(accountId: number): Promise<SingularAccountDailyBalance[]> {
        return this.databaseSourceService.queryArrWithParams(
            `SELECT
                daily.*,
                SUM(incomes - outcomes) OVER(PARTITION BY "currencySymbol" ORDER BY date) AS balance
            FROM (
                SELECT
                    to_char(t.date, 'YYYY-MM-DD') AS date,
                    t.currency_symbol AS "currencySymbol",
                    COUNT(t.id)::int AS "transferCount",
                    COALESCE(SUM(CASE WHEN t.account_id = :accountId THEN t.amount ELSE 0 END), 0)::float8 AS outcomes,
                    COALESCE(SUM(CASE WHEN t.target_account_id = :accountId THEN t.amount ELSE 0 END), 0)::float8 AS incomes
                FROM account AS a
                LEFT JOIN transfer AS t ON t.account_id = a.id OR t.target_account_id = a.id
                WHERE a.id = :accountId
                GROUP BY t.date, t.currency_symbol
            ) AS daily
            ORDER BY date
            `,
            {
                accountId: accountId,
            },
            SingularAccountDailyBalance,
        );
    }

    public async getAccountBalanceForAccountAsOfDate(accountIds: number[], asOfDate: Date): Promise<BalanceDTO[]> {
        const result = await this.dataSource.query(
            `SELECT
                    t.account_id AS "accountId",
                    a.name,
                    SUM(CASE WHEN t.type = $3 THEN t.amount WHEN t.type = $4 THEN -t.amount ELSE 0 END) AS balance
                FROM transfer t
                JOIN account a ON t.account_id = a.id
                WHERE t.date <= $1::date AND a.id = ANY($2::int[])
                GROUP BY t.account_id, a.id, a.name`,
            [this.dateParser.formatMySql(asOfDate), accountIds, TransferType.Income, TransferType.Outcome],
        );
        return result.map((r: { accountId: number; name: string; balance: string }) => {
            return {
                accountId: r.accountId,
                name: r.name,
                balance: parseFloat(r.balance),
            };
        });
    }

    public async getSpendingsAsOfDate(accountIds: number[], asOfDate: Date, userId: number): Promise<BalanceDTO[]> {
        const result = await this.dataSource.query(
            `SELECT a.id, a.name,
                SUM(CASE WHEN t.type = $4 THEN t.amount WHEN t.type = $5 THEN -t.amount ELSE 0 END) AS balance,
                COUNT(t.id) AS transfer_count
                FROM account a
                LEFT JOIN transfer t
                ON t.account_id = a.id AND t.date = $1::date
                WHERE a.id = ANY($2::int[]) AND a.user_id = $3 AND t.type = $5 AND a.currency_symbol = $6
                GROUP BY a.id, a.name`,
            [this.dateParser.formatMySql(asOfDate), accountIds, userId, TransferType.Income, TransferType.Outcome, 'PLN'],
        );
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
        sumOnlyInternalTransfers = true,
    ): Promise<{ year: number; month: number; income: string; outcome: string; count: string }[]> {
        // The previous MySQL-only is_internal filter was commented out, so this remains unfiltered.
        void sumOnlyInternalTransfers;
        return this.dataSource.query(
            `SELECT
                    EXTRACT(YEAR FROM t.date)::int AS "year",
                    EXTRACT(MONTH FROM t.date)::int AS "month",
                    SUM(CASE WHEN t.type = $3 THEN t.amount ELSE 0 END) AS income,
                    SUM(CASE WHEN t.type = $4 THEN t.amount ELSE 0 END) AS outcome,
                    COUNT(t.id)::text AS count
                FROM transfer AS t
                WHERE t.account_id = ANY($1::int[]) AND t.date <= $2::date
                GROUP BY EXTRACT(YEAR FROM t.date), EXTRACT(MONTH FROM t.date)
                ORDER BY "year" DESC, "month" DESC
                LIMIT 12`,
            [accountIds, this.dateParser.getToday(), TransferType.Income, TransferType.Outcome],
        );
    }

    public async getMonthlySubChangeForUserId(userId: number, numberOfLastMonths = 12) {
        return await this.databaseSourceService.queryArrWithParams(
            `
SELECT
    EXTRACT(YEAR FROM t.date)::int AS "changeYear",
    EXTRACT(MONTH FROM t.date)::int AS "changeMonth",
    oa.id AS "originAccountId",
    ta.id AS "targetAccountId",
    COALESCE(SUM(t.amount), 0) AS "monthlySubChange",
    COALESCE(oa.user_id = ta.user_id, false) AS "isInternal",
    COUNT(t.id)::int AS "transferCount"
FROM transfer AS t
LEFT JOIN account AS oa ON oa.id = t.account_id
LEFT JOIN account AS ta ON ta.id = t.target_account_id
WHERE (oa.user_id = :userId OR ta.user_id = :userId)
    AND t.date <= CURRENT_DATE
    AND t.date >= CURRENT_DATE - ((CAST(:monthsCount AS integer) + 1) * INTERVAL '1 month')
GROUP BY EXTRACT(YEAR FROM t.date), EXTRACT(MONTH FROM t.date), oa.id, ta.id, oa.user_id, ta.user_id
ORDER BY "changeYear" DESC, "changeMonth" DESC
        `,
            { userId: userId, monthsCount: numberOfLastMonths },
            AccountMonthlySubChange,
        );
    }

    public async getLastTransferDate(accountId: number): Promise<string> {
        const result = await this.dataSource.query(`SELECT t.date FROM transfer t WHERE t.account_id = $1 ORDER BY t.date DESC LIMIT 1`, [accountId]);
        return result[0]?.date;
    }

    public async getSubBalanceByFilter(filter: { accountIds?: number[]; userId?: number }, asOfDate?: Date): Promise<AccountSubBalance[]> {
        const asOfDateString = asOfDate ? this.dateParser.formatMySql(asOfDate) : this.dateParser.getToday();
        const parameters: unknown[] = [asOfDateString];
        const filters: string[] = [];

        if (filter.accountIds !== undefined) {
            parameters.push(filter.accountIds);
            filters.push(`(oa.id = ANY($${parameters.length}::int[]) OR ta.id = ANY($${parameters.length}::int[]))`);
        }
        if (filter.userId !== undefined) {
            parameters.push(filter.userId);
            filters.push(`(oa.user_id = $${parameters.length} OR ta.user_id = $${parameters.length})`);
        }

        const rows = await this.dataSource.query(
            `
            SELECT
                oa.id AS "fromAccountId",
                oa.name AS "fromAccountName",
                ta.id AS "toAccountId",
                ta.name AS "toAccountName",
                SUM(t.amount) AS "subBalance",
                oa.user_id AS "fromUserId",
                ta.user_id AS "toUserId",
                COALESCE(oa.user_id = ta.user_id, false) AS "isInternalTransfer"
            FROM transfer AS t
            LEFT JOIN account oa ON t.account_id = oa.id
            LEFT JOIN account ta ON t.target_account_id = ta.id
            WHERE t.date <= $1::date
                ${filters.map((filterSql) => `AND ${filterSql}`).join('\n                ')}
            GROUP BY oa.id, oa.name, ta.id, ta.name, oa.user_id, ta.user_id
            `,
            parameters,
        );
        return rows.map((row: AccountSubBalance) => plainToInstance(AccountSubBalance, row));
    }

    public async getBalanceNew(
        filter: { accountIds?: number[]; userId?: number },
        asOfDate?: Date,
    ): Promise<
        {
            accountId: number;
            accountName: string;
            currencySymbol: string;
            balance: string;
            userId: number;
        }[]
    > {
        const asOfDateString = asOfDate ? this.dateParser.formatMySql(asOfDate) : this.dateParser.getToday();
        const parameters: unknown[] = [asOfDateString];
        const filters: string[] = [];

        if (filter.accountIds !== undefined) {
            parameters.push(filter.accountIds);
            filters.push(`oa.id = ANY($${parameters.length}::int[])`);
        }
        if (filter.userId !== undefined) {
            parameters.push(filter.userId);
            filters.push(`oa.user_id = $${parameters.length}`);
        }

        return this.dataSource.query(
            `
            SELECT
                oa.id AS "accountId",
                oa.name AS "accountName",
                c.symbol AS "currencySymbol",
                (
                    (SELECT
                        COALESCE(SUM(ot.amount), 0)
                    FROM transfer ot
                    WHERE ot.target_account_id = oa.id
                        AND ot.currency_symbol = oa.currency_symbol
                        AND ot.date <= $1::date)
                    - COALESCE(SUM(t.amount), 0)
                ) AS balance,
                oa.user_id AS "userId"
            FROM account AS oa
            LEFT JOIN currency AS c ON oa.currency_symbol = c.symbol
            LEFT JOIN transfer AS t ON t.account_id = oa.id AND t.date <= $1::date
            ${filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : ''}
            GROUP BY oa.id, oa.name, c.symbol, oa.currency_symbol, oa.user_id
        `,
            parameters,
        );
    }
}
