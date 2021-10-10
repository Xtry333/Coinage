import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConnectionOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import migrations from './src/app/migrations/_index';
import entities from './src/app/entities/_index';

export default {
    name: 'default',
    type: 'mysql',
    host: process.env.MYSQL_HOST || 'localhost',
    port: 3306,
    username: 'root',
    password: process.env.MYSQL_ROOT_PASSWORD,
    database: 'coinage-db',
    synchronize: false,
    logging: false,
    migrationsRun: true,
    migrations: migrations,
    migrationsTransactionMode: 'all',
    entities: entities,
    namingStrategy: new SnakeNamingStrategy(),
    cli: {
        migrationsDir: 'migrations',
    },
} as ConnectionOptions as TypeOrmModuleOptions;
