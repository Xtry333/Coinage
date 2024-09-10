import { Injectable } from '@nestjs/common';

@Injectable()
export class DateParserService {
    public formatMySql(date: Date) {
        return date.toISOString().slice(0, 10);
    }

    public toUTCString(date: Date) {
        return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
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

    public getEndOfMonth(year: number, month: number): Date {
        const date = new Date(year, month, 1);
        date.setMonth(date.getMonth() + 1);
        date.setDate(0);
        return date;
    }

    public getEndOfMonthSeconds(year: number, month: number): Date {
        const date = new Date(year, month, 1);
        date.setMonth(date.getMonth() + 1);
        date.setMilliseconds(date.getMilliseconds() - 1);
        return date;
    }

    public getToday(): string {
        const date = new Date();
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }
}
