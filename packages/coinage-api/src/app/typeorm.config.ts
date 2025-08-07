import { DataSource, DataSourceOptions, Table } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import entities from './entities/_index';
import migrations from '../database/migrations/_index';

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
    migrationsRun: false,
    migrations: migrations,
    migrationsTransactionMode: 'each',
    entities: [...entities],
    timezone: 'Z',
    namingStrategy: new CustomNamingStrategy(),
};

export const dataSource = new DataSource(opts);
