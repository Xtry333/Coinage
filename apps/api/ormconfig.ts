import { ConnectionOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import entities from './src/app/entities/_index';
import migrations from './src/app/migrations/_index';

export default {
    name: 'default',
    type: 'mysql',
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.COINAGE_MYSQL_PORT || 3306,
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
    cli: {
        migrationsDir: 'migrations',
    },
} as ConnectionOptions as TypeOrmModuleOptions;
