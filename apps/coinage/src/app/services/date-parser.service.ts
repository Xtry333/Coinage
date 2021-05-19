import { Injectable } from '@angular/core';

export interface PartedDate {
    year?: number;
    month?: number;
    day?: number;
}

@Injectable({
    providedIn: 'root',
})
export class DateParserService {
    constructor() {}

    public formatDate(date: Date): string {
        const parted: PartedDate = { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
        return this.joinPartedDate(parted);
    }

    public joinPartedDate(parted: PartedDate): string {
        let date = parted.year.toString().padStart(4, '0');
        if (parted.month !== undefined) {
            date += '-' + parted.month.toString().padStart(2, '0');
            if (parted.day !== undefined) {
                date += '-' + parted.day.toString().padStart(2, '0');
            }
        }
        return date;
    }

    public getDateFromParted(parted: PartedDate): Date {
        if (parted.day) {
            return new Date(parted.year, parted.month - 1, parted.day);
        } else if (parted.month) {
            return new Date(parted.year, parted.month - 1, 1);
        } else {
            return new Date(parted.year, 0, 1);
        }
    }
}
