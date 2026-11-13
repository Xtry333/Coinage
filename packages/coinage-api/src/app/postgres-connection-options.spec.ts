import { getPostgresConnectionOptions } from './postgres-connection-options';

describe('PostgreSQL connection options', () => {
    it('uses PG_* values even when conflicting legacy variables are present', () => {
        const environment: Record<string, string> = {
            COINAGE_POSTGRES_HOST: 'localhost',
            COINAGE_POSTGRES_PORT: '5432',
            COINAGE_POSTGRES_USER: 'coinage-db-admin',
            COINAGE_POSTGRES_PASSWORD: 'test-only-password',
            COINAGE_POSTGRES_DB: 'coinage-db',
            COINAGE_COINAGE_POSTGRES_PORT: '15432',
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
        expect(getEnvironment.mock.calls.map(([name]) => name)).toEqual(['COINAGE_POSTGRES_HOST', 'COINAGE_POSTGRES_PORT', 'COINAGE_POSTGRES_USER', 'COINAGE_POSTGRES_PASSWORD', 'COINAGE_POSTGRES_DB']);
    });

    it('supports a non-default PostgreSQL host and port', () => {
        const environment: Record<string, string> = { COINAGE_POSTGRES_HOST: 'coinage-db', COINAGE_POSTGRES_PORT: '55432' };

        expect(getPostgresConnectionOptions((name) => environment[name])).toMatchObject({ host: 'coinage-db', port: 55432 });
    });

    it.each([undefined, '', 'not-a-port'])('defaults to port 5432 when COINAGE_POSTGRES_PORT is %s, ignoring the old MySQL port', (port) => {
        const environment: Record<string, string | undefined> = { COINAGE_POSTGRES_PORT: port, COINAGE_MYSQL_PORT: '3306' };

        expect(getPostgresConnectionOptions((name) => environment[name])).toEqual({
            host: 'localhost',
            port: 5432,
            username: undefined,
            password: undefined,
            database: undefined,
        });
    });
});
