import { Injectable } from '@angular/core';
import { BalanceDTO } from '@coinage-app/interfaces';
import { DeleteResult, Equal, getConnection } from 'typeorm';
import { Account } from '../entities/Account.entity';

@Injectable({
    providedIn: 'root',
})
export class AccountDao {
    public async getById(id: number): Promise<Account> {
        const account = await getConnection()
            .getRepository(Account)
            .findOne({ where: { id: Equal(id) } });
        if (!account) {
            throw new Error(`Account with id ${id} not found.`);
        }
        return account;
    }

    public getAll(): Promise<Account[]> {
        return getConnection().getRepository(Account).find();
    }

    public getForAccount(userId: number): Promise<Account[]> {
        return getConnection()
            .getRepository(Account)
            .find({ where: { userId: Equal(userId) } });
    }

    public save(account: Account): Promise<Account> {
        return getConnection().getRepository(Account).save(account);
    }

    public deleteById(id: number): Promise<DeleteResult> {
        return getConnection()
            .getRepository(Account)
            .delete({ id: Equal(id) });
    }

    public async getAccountBalance(accountIds: number[]): Promise<BalanceDTO[]> {
        const result = await getConnection().query(
            // `SELECT SUM(CASE WHEN t.type = 'INCOME' THEN t.amount WHEN t.type = 'OUTCOME' THEN t.amount * -1 ELSE 0 END) AS balance FROM transfer t WHERE t.account_id IN (${accountIds.join(
            //     ','
            // )});`
            `
                SELECT t.account_id AS accountId,
                SUM(CASE WHEN t.type = 'INCOME' THEN t.amount WHEN t.type = 'OUTCOME' THEN -t.amount ELSE 0 END) AS balance
                FROM transfer t
                JOIN account a ON t.account_id = a.id
                WHERE t.date <= '${this.getToday()}' AND a.id IN (${accountIds.join(',')})
                GROUP BY t.account_id;`
        );
        return result.map((r: { accountId: number; balance: string }) => {
            return {
                accountId: r.accountId,
                balance: parseFloat(r.balance),
            };
        });
    }

    private getToday(): string {
        const date = new Date();
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }
}
