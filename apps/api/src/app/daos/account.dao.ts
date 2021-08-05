import { Injectable } from '@angular/core';
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

    public save(account: Account): Promise<Account> {
        return getConnection().getRepository(Account).save(account);
    }

    public deleteById(id: number): Promise<DeleteResult> {
        return getConnection()
            .getRepository(Account)
            .delete({ id: Equal(id) });
    }
}
