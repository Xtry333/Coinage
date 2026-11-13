import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

type ConnectionOptions = Pick<PostgresConnectionOptions, 'host' | 'port' | 'username' | 'password' | 'database'>;

// Shared by Nest's ConfigService and the TypeORM CLI; legacy MySQL variables must not override PostgreSQL.
export function getPostgresConnectionOptions(getEnvironment: (name: string) => string | undefined = (name) => process.env[name]): ConnectionOptions {
    return {
        host: getEnvironment('COINAGE_POSTGRES_HOST') || 'localhost',
        port: Number(getEnvironment('COINAGE_POSTGRES_PORT')) || 5432,
        username: getEnvironment('COINAGE_POSTGRES_USER'),
        password: getEnvironment('COINAGE_POSTGRES_PASSWORD'),
        database: getEnvironment('COINAGE_POSTGRES_DB'),
    };
}
