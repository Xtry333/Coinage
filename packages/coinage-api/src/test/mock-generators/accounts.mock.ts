import { Account } from '../../app/entities/Account.entity';
import { createMockCurrency } from './currency.mock';

export function createMockAccounts(count: number): Account[] {
    const accounts: Account[] = [];
    for (let i = 0; i < count; i++) {
        accounts.push(createMockAccount(i));
    }
    return accounts;
}

export function createMockAccount(id: number): Account {
    const account = new Account();
    account.id = id;
    account.name = `Account ${id}`;
    account.currency = createMockCurrency(`PLN`);
    account.isActive = true;
    account.isContractorAccount = false;
    return account;
}
