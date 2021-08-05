import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConnectionOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { Account } from './src/app/entities/Account.entity';
import { Category } from './src/app/entities/Category.entity';
import { Contractor } from './src/app/entities/Contractor.entity';
import { Receipt } from './src/app/entities/Receipt.entity';
import { Transfer } from './src/app/entities/Transfer.entity';

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
    entities: [Category, Contractor, Receipt, Transfer, Account],
    namingStrategy: new SnakeNamingStrategy(),
} as ConnectionOptions as TypeOrmModuleOptions;
