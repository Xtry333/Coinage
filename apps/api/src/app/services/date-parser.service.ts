import { Injectable } from '@nestjs/common';

@Injectable()
export class DateParserService {
    public formatMySql(date: Date) {
        return date.toISOString().slice(0, 10);
    }

    public getStartOfNextMonthDate(): Date {
        const date = new Date();
        date.setDate(1);
        date.setMonth(date.getMonth() + 1);
        return date;
    }

    public getEndOfCurrentMonthDate(): Date {
        const date = this.getStartOfNextMonthDate();
        date.setDate(date.getDate() - 1);
        return date;
    }
}
