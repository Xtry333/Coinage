import { NewMonthlyUserStatsDTO } from '@app/interfaces';
import { Injectable } from '@nestjs/common';
import { AccountDao } from '../daos/account.dao';
import { AccountMonthlySubChange } from '../daos/daoDtos/AccountMonthlySubBalance.dto';
import { DateParserService } from './date-parser.service';

@Injectable()
export class AccountBalanceService {
    public constructor(
        private readonly accountDao: AccountDao,
        private readonly dateParser: DateParserService,
    ) {}

    public async getAccountsBalanceByIds(accountIds: number[], asOfDate?: Date | undefined) {
        // const subBalances = await this.accountDao.getSubBalanceByFilter({ accountIds }, asOfDate);
        // const accountBalances = accountIds.map((id) => ({ accountId: id, name: '', balance: 0 }));

        // for (const account of accountBalances) {
        //     const incomingBalance = subBalances
        //         .filter((b) => b.toAccountId === account.accountId)
        //         .map((b) => b.subBalance)
        //         .reduce((a, b) => a + b, 0);
        //     const outgoingBalance = subBalances
        //         .filter((b) => b.fromAccountId === account.accountId)
        //         .map((b) => b.subBalance)
        //         .reduce((a, b) => a + b, 0);

        //     account.name = subBalances.find((a) => a.fromAccountId === account.accountId)?.fromAccountName ?? '';
        //     account.balance = incomingBalance - outgoingBalance;
        // }

        const balance = (await this.accountDao.getBalanceNew({ accountIds }, asOfDate)).map((b) => ({
            accountId: b.accountId,
            name: b.accountName,
            balance: parseFloat(b.balance),
            currencySymbol: b.currencySymbol,
        }));

        return balance;
    }

    public async getAccountDailyBalanceById(accountId: number) {
        // const subBalances = await this.accountDao.getSubBalanceByFilter({ accountIds }, asOfDate);
        // const accountBalances = accountIds.map((id) => ({ accountId: id, name: '', balance: 0 }));

        // for (const account of accountBalances) {
        //     const incomingBalance = subBalances
        //         .filter((b) => b.toAccountId === account.accountId)
        //         .map((b) => b.subBalance)
        //         .reduce((a, b) => a + b, 0);
        //     const outgoingBalance = subBalances
        //         .filter((b) => b.fromAccountId === account.accountId)
        //         .map((b) => b.subBalance)
        //         .reduce((a, b) => a + b, 0);

        //     account.name = subBalances.find((a) => a.fromAccountId === account.accountId)?.fromAccountName ?? '';
        //     account.balance = incomingBalance - outgoingBalance;
        // }

        const accountDetails = await this.accountDao.getById(accountId);
        const balance = await this.accountDao.getSingularAccountDailyBalance(accountId);
        return {
            accountId: accountDetails.id,
            accountName: accountDetails.name,
            accountOwnerUserId: accountDetails.userId,
            accountCurrency: accountDetails.currency.symbol,
            dailyBalance: balance,
        };
    }

    public async getAccountsBalanceForUserId(userId: number) {
        const userAccounts = await this.accountDao.getForUserId(userId);
        const subBalances = await this.accountDao.getSubBalanceByFilter({ userId });
        const accountBalances = userAccounts.map((account) => ({ accountId: account.id, balance: 0 }));

        for (const account of accountBalances) {
            const incomingBalance = subBalances
                .filter((b) => b.toAccountId === account.accountId)
                .map((b) => b.subBalance)
                .reduce((a, b) => a + b, 0);
            const outgoingBalance = subBalances
                .filter((b) => b.fromAccountId === account.accountId)
                .map((b) => b.subBalance)
                .reduce((a, b) => a + b, 0);

            account.balance = incomingBalance - outgoingBalance;
        }

        return accountBalances;
    }

    public async getMonthlyAccountsBalanceForUserId(userId: number, numberOfLastMonths = 12): Promise<NewMonthlyUserStatsDTO[]> {
        const monthlyDates = this.buildMonthlyDates(numberOfLastMonths).reverse();
        const userAccounts = await this.accountDao.getForUserId(userId);
        const monthlySubChanges = await this.accountDao.getMonthlySubChangeForUserId(userId, numberOfLastMonths);
        // const beginningMonth = new Date();
        // beginningMonth.setMonth(new Date().getMonth()-12)
        // beginningMonth.setDate(28)
        const initialBalance = await this.getInitialBalance(
            userAccounts.map((a) => a.id),
            monthlyDates[0],
        );

        const sumMonthlySubChange = (accountId: number, targetAccountKey: keyof AccountMonthlySubChange, validSubBalances: AccountMonthlySubChange[]) => {
            return validSubBalances.filter((b) => b[targetAccountKey] === accountId).reduce((sum, b) => sum + b.monthlySubChange, 0);
        };

        return monthlyDates
            .map((date) => {
                const validSubChanges = monthlySubChanges.filter((b) => b.changeYear === date.year && b.changeMonth === date.month),
                    externalOnlyValidSubChanges = validSubChanges.filter((b) => !b.isInternal);
                const accountMonthlyChanges = userAccounts
                    //.filter((a) => a.id === 6) // debug view
                    .map((account) => {
                        const accountBalance = initialBalance.find((a) => a.accountId === account.id) ?? {
                            accountId: account.id,
                            accountName: account.name,
                            balance: '0',
                            userId: account.userId,
                        };
                        const totalIncoming = sumMonthlySubChange(account.id, 'targetAccountId', validSubChanges),
                            totalOutgoing = sumMonthlySubChange(account.id, 'originAccountId', validSubChanges);
                        accountBalance.balance = (parseFloat(accountBalance.balance) + totalIncoming - totalOutgoing).toFixed(2);
                        return {
                            accountId: account.id,
                            balance: parseFloat(accountBalance.balance),
                            totalIncoming: totalIncoming,
                            totalOutgoing: totalOutgoing,
                            externalIncoming: sumMonthlySubChange(account.id, 'targetAccountId', externalOnlyValidSubChanges),
                            externalOutgoing: sumMonthlySubChange(account.id, 'originAccountId', externalOnlyValidSubChanges),
                        };
                    });
                const subChange = accountMonthlyChanges.reduce((sum, a) => {
                    return {
                        accountId: 0,
                        balance: sum.balance + a.balance,
                        totalIncoming: sum.totalIncoming + a.totalIncoming,
                        totalOutgoing: sum.totalOutgoing + a.totalOutgoing,
                        externalIncoming: sum.externalIncoming + a.externalIncoming,
                        externalOutgoing: sum.externalOutgoing + a.externalOutgoing,
                    };
                });
                return {
                    year: date.year,
                    month: date.month,
                    totalIncoming: subChange.totalIncoming,
                    totalOutgoing: subChange.totalOutgoing,
                    totalChange: subChange.totalIncoming - subChange.totalOutgoing,
                    externalIncoming: subChange.externalIncoming,
                    externalOutgoing: subChange.externalOutgoing,
                    externalChange: subChange.externalIncoming - subChange.externalOutgoing,
                    balance: subChange.balance,
                    accountStats: accountMonthlyChanges,
                    // .filter(
                    //     (a) => ![a.externalIncoming, a.externalOutgoing, a.totalIncoming, a.totalOutgoing].every((e) => e === 0)
                    // ),
                };
            })
            .reverse();
    }

    private buildMonthlyDates(numberOfLastMonths: number) {
        const today = new Date();
        let year = today.getFullYear();
        let month = today.getMonth() + 1;
        const dates: { year: number; month: number }[] = [];

        for (let i = 0; i < numberOfLastMonths; i++) {
            dates.push({ year, month });
            month--;
            if (month <= 0) {
                year--;
                month = 12;
            }
        }

        return dates;
    }

    private async getInitialBalance(accountIds: number[], date: { year: number; month: number }) {
        const initialDate = this.dateParser.getEndOfMonthSeconds(date.year, date.month - 2);
        return await this.accountDao.getBalanceNew({ accountIds }, initialDate);
    }
}
