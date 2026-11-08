import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

type ConnectionOptions = Pick<PostgresConnectionOptions, 'host' | 'port' | 'username' | 'password' | 'database'>;

// Shared by Nest's ConfigService and the TypeORM CLI; legacy MySQL variables must not override PostgreSQL.
export function getPostgresConnectionOptions(getEnvironment: (name: string) => string | undefined = (name) => process.env[name]): ConnectionOptions {
    return {
        host: getEnvironment('PG_HOST') || 'localhost',
        port: Number(getEnvironment('PG_PORT')) || 5432,
        username: getEnvironment('PG_USER'),
        password: getEnvironment('PG_PASSWORD'),
        database: getEnvironment('PG_DATABASE'),
    };
}
