import * as path from 'path';

import { DataSource, DataSourceOptions, Table } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import entities from './entities/_index';

function loadMigrations(): (Function | string)[] {
    // webpack bundles everything; require.context resolves matching modules at build time
    if (typeof (require as any).context === 'function') {
        const ctx = (require as any).context('../database/migrations', false, /^\.\/(\d+\S*)\.(ts|js)$/);
        return ctx
            .keys()
            .sort()
            .flatMap((key: string) => (Object.values(ctx(key)) as Function[]).filter((v) => typeof v === 'function'));
    }
    // ts-node context (TypeORM CLI): return a glob pattern for TypeORM to resolve
    return [path.join(__dirname, '../database/migrations/[0-9]*.{ts,js}')];
}

export class CustomNamingStrategy extends SnakeNamingStrategy {
    public foreignKeyName(tableOrName: Table | string, columnNames: string[], referencedTablePath: string, referencedColumnNames: string[]): string {
        const tableName = typeof tableOrName === 'string' ? tableOrName : tableOrName.name;
        const columnNamesString = columnNames.join('_');
        const referencedColumnNamesString = referencedColumnNames.join('_');
        return `FK_${tableName}_${columnNamesString}_REF_${referencedTablePath}_${referencedColumnNamesString}`;
    }

    public uniqueConstraintName(tableOrName: string | Table, columnNames: string[]): string {
        const tableName = typeof tableOrName === 'string' ? tableOrName : tableOrName.name;
        const columnNamesString = columnNames.join('_');
        return `UQ_${tableName}_${columnNamesString}`;
    }

    public indexName(tableOrName: string | Table, columnNames: string[]): string {
        const tableName = typeof tableOrName === 'string' ? tableOrName : tableOrName.name;
        const columnNamesString = columnNames.join('_');
        return `IDX_${tableName}_ON_${columnNamesString}`;
    }
}

export const opts: DataSourceOptions = {
    type: 'mysql',
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.COINAGE_MYSQL_PORT) || 3306,
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    synchronize: false,
    logging: false,
    migrationsRun: true,
    migrations: loadMigrations(),
    migrationsTransactionMode: 'each',
    entities: [...entities],
    timezone: 'Z',
    namingStrategy: new CustomNamingStrategy(),
};

export const dataSource = new DataSource(opts);
