import { Injectable } from '@nestjs/common';
import { BalanceDTO } from '@coinage-app/interfaces';
import { DeleteResult, Equal, getConnection } from 'typeorm';
import { Account } from '../entities/Account.entity';
import { TransferType } from '../entities/Category.entity';
import { DateParserService } from '../services/date-parser.service';

@Injectable()
export class AccountDao {
    constructor(private readonly dateParser: DateParserService) {}

    public async getById(id: number): Promise<Account> {
        const account = await getConnection()
            .getRepository(Account)
            .findOne({ where: { id: Equal(id) } });
        if (!account) {
            throw new Error(`Account with id ${id} not found.`);
        }
        return account;
    }

    public getAllActive(): Promise<Account[]> {
        return getConnection()
            .getRepository(Account)
            .find({ where: { isActiveBuffer: Equal(true) } });
    }

    public getForUserId(userId: number): Promise<Account[]> {
        return getConnection()
            .getRepository(Account)
            .find({ where: { userId: Equal(userId), isActiveBuffer: Equal(true) } });
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

    public async getLastTransferDate(accountId: number): Promise<string> {
        const result = await getConnection().query(`SELECT t.date FROM transfer t WHERE t.account_id = ${accountId} ORDER BY t.date DESC LIMIT 1;`);
        return result[0].date;
    }
}
