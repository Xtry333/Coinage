import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import entities from './entities/_index';
import migrations from './migrations/_index';

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
    migrations: migrations,
    migrationsTransactionMode: 'all',
    entities: entities,
    timezone: 'Z',
    namingStrategy: new SnakeNamingStrategy(),
};

export const dataSource = new DataSource(opts);
