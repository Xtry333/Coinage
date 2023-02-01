import { Injectable } from '@nestjs/common';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { DataSource, ObjectLiteral } from 'typeorm';

@Injectable()
export class DatabaseSourceService {
    public constructor(private readonly dataSource: DataSource) {}

    public async queryWithParams<T>(sql: string, params: ObjectLiteral, cls: ClassConstructor<T>): Promise<T[]>;
    public async queryWithParams<T>(sql: string, params: ObjectLiteral, cls: ClassConstructor<T>): Promise<T> {
        const escapedQueryWithParams = this.dataSource.driver.escapeQueryWithParameters(sql, params, {});
        return plainToInstance(cls, this.dataSource.query(...escapedQueryWithParams));
    }
}
