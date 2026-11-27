import { DataSource, QueryRunner, Repository } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { SignedItemPrices1795776000000 } from './1795776000000-SignedItemPrices';
import { AccountDao } from '../../app/daos/account.dao';
import { CategoryDao } from '../../app/daos/category.dao';
import entities from '../../app/entities/_index';
import { Account } from '../../app/entities/Account.entity';
import { Category } from '../../app/entities/Category.entity';
import { getPostgresConnectionOptions } from '../../app/postgres-connection-options';
import { DatabaseSourceService } from '../../app/services/database-source.service';
import { DateParserService } from '../../app/services/date-parser.service';

// Opt in with COINAGE_SIGNED_ITEMS_DB_TEST=1. No application data is touched:
// fixtures, migrations and assertions share a disposable schema and rolled-back transaction.
const integration = process.env['COINAGE_SIGNED_ITEMS_DB_TEST'] === '1' ? describe : describe.skip;

integration('signed item migration and balances on PostgreSQL', () => {
    let source: DataSource;
    let runner: QueryRunner;

    beforeAll(async () => {
        source = new DataSource({
            type: 'postgres',
            ...getPostgresConnectionOptions(),
            synchronize: false,
            entities,
            namingStrategy: new SnakeNamingStrategy(),
        });
        await source.initialize();
        runner = source.createQueryRunner();
        await runner.connect();
        await runner.startTransaction();
        const schema = `coinage_signed_items_test_${process.pid}_${Date.now()}`;
        await runner.query(`CREATE SCHEMA "${schema}"`);
        await runner.query(`SET LOCAL search_path TO "${schema}"`);
        await runner.query(`
            CREATE TABLE item (id INT PRIMARY KEY, name VARCHAR(50));
            CREATE TABLE account (id INT PRIMARY KEY, name VARCHAR(50), user_id INT);
            CREATE TABLE category (id INT PRIMARY KEY, name VARCHAR(50), parent_id INT, type VARCHAR(10));
            CREATE TABLE transfer (
                id INT PRIMARY KEY, amount NUMERIC(20,2), account_id INT, target_account_id INT,
                owner_user_id INT, category_id INT, type VARCHAR(10), metadata JSONB NOT NULL DEFAULT '{}', date DATE
            );
            CREATE TABLE transfer_item (
                id INT PRIMARY KEY, item_id INT, transfer_id INT, quantity DOUBLE PRECISION,
                unit_price NUMERIC(12,2), total_set_price NUMERIC(12,2), total_set_discount NUMERIC(12,2)
            );
            INSERT INTO item VALUES (10, 'Kaucja');
            INSERT INTO account VALUES (1, 'Cash', 7), (17, 'Shop', NULL);
            INSERT INTO category VALUES (2, 'Deposits', NULL, 'OUTCOME');
            INSERT INTO transfer (id, amount, account_id, target_account_id, owner_user_id, category_id, type, date)
                VALUES (1, 3, 17, 1, 7, 2, 'INCOME', '2026-11-27'),
                       (2, 2, 1, 17, 7, 2, 'OUTCOME', '2026-11-27'),
                       (3, 0, 1, 17, 7, 2, 'OUTCOME', '2026-11-27');
            INSERT INTO transfer_item VALUES (1, 10, 1, 6, -0.5, -3, 0), (2, 10, 2, 4, 0.5, 2, 0)
        `);
        await new SignedItemPrices1795776000000().up(runner);
    });

    afterAll(async () => {
        if (runner?.isTransactionActive) await runner.rollbackTransaction();
        if (runner) await runner.release();
        if (source?.isInitialized) await source.destroy();
    });

    it('defaults existing items to PRODUCT and uses a reference table rather than a native enum', async () => {
        expect(await runner.query(`SELECT kind_code FROM item WHERE id = 10`)).toEqual([{ kind_code: 'PRODUCT' }]);
        expect(await runner.query(`SELECT code FROM item_kind ORDER BY code`)).toEqual([{ code: 'ADJUSTMENT' }, { code: 'DEPOSIT' }, { code: 'PRODUCT' }]);
    });

    it('preserves explicit account direction, amounts, metadata and every signed item line', async () => {
        expect(await runner.query(`SELECT amount, origin_account_id, target_account_id, metadata FROM transfer WHERE id = 1`)).toEqual([
            { amount: '3.00', origin_account_id: 17, target_account_id: 1, metadata: {} },
        ]);
        expect(await runner.query(`SELECT unit_price, total_set_price FROM transfer_item ORDER BY id`)).toEqual([
            { unit_price: '-0.50', total_set_price: '-3.00' },
            { unit_price: '0.50', total_set_price: '2.00' },
        ]);
    });

    it('credits explicitly incoming transfers in account balances', async () => {
        const isolatedSource = { query: runner.query.bind(runner) } as unknown as DataSource;
        const accounts = new AccountDao({} as Repository<Account>, new DateParserService(), isolatedSource, {} as DatabaseSourceService);
        const balances = await accounts.getAccountBalanceForAccountAsOfDate([1], new Date('2026-11-30'));
        expect(balances).toEqual([{ accountId: 1, name: 'Cash', balance: 1 }]);
    });

    it('subtracts explicitly incoming transfers from category spending', async () => {
        const isolatedSource = { createQueryBuilder: runner.manager.createQueryBuilder.bind(runner.manager) } as unknown as DataSource;
        const categories = new CategoryDao({} as Repository<Category>, isolatedSource);
        const [category] = await categories.getTotalByCategoryMonth(2026, 11, undefined, 7);
        expect(Number(category.amount)).toBe(-1);
    });

    it('rejects legacy negative amounts during migration instead of rewriting accounts', async () => {
        await runner.startTransaction();
        try {
            const schema = `coinage_negative_transfer_test_${process.pid}_${Date.now()}`;
            await runner.query(`CREATE SCHEMA "${schema}"`);
            await runner.query(`SET LOCAL search_path TO "${schema}"`);
            await runner.query(`
                CREATE TABLE item (id INT PRIMARY KEY, name VARCHAR(50));
                CREATE TABLE transfer (id INT PRIMARY KEY, amount NUMERIC(20,2), account_id INT, target_account_id INT, metadata JSONB);
                INSERT INTO item VALUES (1, 'Product');
                INSERT INTO transfer VALUES (1, -3, 1, 17, '{"note":"Keep me"}');
            `);
            await runner.startTransaction();
            try {
                await expect(new SignedItemPrices1795776000000().up(runner)).rejects.toMatchObject({
                    driverError: { code: '23514', constraint: 'ck_transfer_amount_nonnegative' },
                });
            } finally {
                await runner.rollbackTransaction();
            }
            expect(await runner.query(`SELECT amount, account_id, target_account_id, metadata FROM transfer`)).toEqual([
                { amount: '-3.00', account_id: 1, target_account_id: 17, metadata: { note: 'Keep me' } },
            ]);
        } finally {
            await runner.rollbackTransaction();
        }
    });

    it.each([
        [`UPDATE item SET kind_code = 'UNKNOWN' WHERE id = 10`, '23503'],
        [`UPDATE transfer SET amount = -1 WHERE id = 1`, '23514'],
    ])('enforces the reference and nonnegative transfer constraints: %s', async (sql, code) => {
        await runner.startTransaction();
        try {
            await expect(runner.query(sql)).rejects.toMatchObject({ driverError: { code } });
        } finally {
            await runner.rollbackTransaction();
        }
    });
});
