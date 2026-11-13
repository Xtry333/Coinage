import { getPostgresConnectionOptions } from './postgres-connection-options';

describe('PostgreSQL connection options', () => {
    it('uses PG_* values even when conflicting legacy variables are present', () => {
        const environment: Record<string, string> = {
            PG_HOST: 'localhost',
            PG_PORT: '5432',
            PG_USER: 'coinage-db-admin',
            PG_PASSWORD: 'test-only-password',
            PG_DATABASE: 'coinage-db',
            COINAGE_PG_PORT: '15432',
            COINAGE_MYSQL_PORT: '3306',
            MYSQL_HOST: 'old-mysql-host',
            MYSQL_USER: 'old-mysql-user',
            MYSQL_PASSWORD: 'old-test-password',
            MYSQL_DATABASE: 'old-mysql-database',
        };
        const getEnvironment = jest.fn((name: string) => environment[name]);

        expect(getPostgresConnectionOptions(getEnvironment)).toEqual({
            host: 'localhost',
            port: 5432,
            username: 'coinage-db-admin',
            password: 'test-only-password',
            database: 'coinage-db',
        });
        expect(getEnvironment.mock.calls.map(([name]) => name)).toEqual(['PG_HOST', 'PG_PORT', 'PG_USER', 'PG_PASSWORD', 'PG_DATABASE']);
    });

    it('supports a non-default PostgreSQL host and port', () => {
        const environment: Record<string, string> = { PG_HOST: 'coinage-db', PG_PORT: '55432' };

        expect(getPostgresConnectionOptions((name) => environment[name])).toMatchObject({ host: 'coinage-db', port: 55432 });
    });

    it.each([undefined, '', 'not-a-port'])('defaults to port 5432 when PG_PORT is %s, ignoring the old MySQL port', (port) => {
        const environment: Record<string, string | undefined> = { PG_PORT: port, COINAGE_MYSQL_PORT: '3306' };

        expect(getPostgresConnectionOptions((name) => environment[name])).toEqual({
            host: 'localhost',
            port: 5432,
            username: undefined,
            password: undefined,
            database: undefined,
        });
    });
});
