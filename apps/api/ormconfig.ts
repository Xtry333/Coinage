import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConnectionOptions } from 'typeorm';
import { Category } from './src/app/entity/Category.entity';
import { Contractor } from './src/app/entity/Contractor.entity';
import { Transfer } from './src/app/entity/Transfer.entity';

export default ({
    name: 'default',
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'zBiSHVzhDbgTK3dd',
    database: 'coinage-db',
    synchronize: false,
    logging: false,
    entities: [Category, Contractor, Transfer],
} as ConnectionOptions) as TypeOrmModuleOptions;
