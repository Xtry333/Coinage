import { Injectable } from '@nestjs/common';

@Injectable()
export class DateParserService {
    public formatMySql(date: Date) {
        return date.toISOString().slice(0, 10);
    }
}
