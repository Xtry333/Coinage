import { Injectable } from '@nestjs/common';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { DataSource, ObjectLiteral } from 'typeorm';

@Injectable()
export class DatabaseSourceService {
    public constructor(private readonly dataSource: DataSource) {}

    public async queryArrWithParams<T>(sql: string, params: ObjectLiteral, cls: ClassConstructor<T>): Promise<T[]>;
    public async queryArrWithParams<T>(sql: string, params: ObjectLiteral, cls: ClassConstructor<T>): Promise<T> {
        const cleanSql = this.removeNewLinesWhiteSpaces(sql);
        const escapedQueryWithParams = this.dataSource.driver.escapeQueryWithParameters(cleanSql, params, {});
        return plainToInstance(cls, this.dataSource.query(...escapedQueryWithParams));
    }

    private removeNewLinesWhiteSpaces(raw: string): string {
        return raw.trim().replace(/(\r\n|\n|\r|\s+)/gm, ' ');
    }
}
