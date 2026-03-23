import * as path from 'path';

import { DataSource, DataSourceOptions, Table } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import entities from './entities/_index';

export function loadMigrations(): (Function | string)[] {
    // Detect webpack context via __webpack_require__ (injected by webpack at build time).
    // Checking `typeof require.context` instead triggers a webpack warning:
    // "Critical dependency: require function is used in a way in which dependencies cannot
    // be statically extracted" — which prevents webpack from bundling the context modules.
    // Using __webpack_require__ for the guard avoids that; webpack still statically analyzes
    // the require.context(...) call below and bundles all matching migration files.
    // @ts-expect-error: __webpack_require__ is injected by webpack, not in Node typings
    if (typeof __webpack_require__ !== 'undefined') {
        // @ts-expect-error: require.context is a webpack-specific API not in Node typings
        const ctx = require.context('../database/migrations', false, /^\.\/(\d+\S*)\.(ts|js)$/);
        return ctx
            .keys()
            .sort()
            .flatMap((key: string) => (Object.values(ctx(key)) as Function[]).filter((v) => typeof v === 'function'));
    }
    // ts-node context (TypeORM CLI): return glob patterns for TypeORM to resolve
    return [
        path.join(__dirname, '../database/migrations/[0-9]*.ts'),
        path.join(__dirname, '../database/migrations/[0-9]*.js'),
    ];
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
