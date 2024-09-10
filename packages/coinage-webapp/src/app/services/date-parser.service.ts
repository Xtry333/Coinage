import { Injectable } from '@angular/core';

export interface PartedDate {
    year: number;
    month?: number;
    day?: number;
}

@Injectable({
    providedIn: 'root',
})
export class DateParserService {
    public formatDate(date: Date): string {
        const parted: PartedDate = { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
        return this.joinPartedDate(parted);
    }

    public toPartedDate(dateString: string): PartedDate {
        const dateParts = dateString.split('-');
        return { year: +dateParts[0], month: +dateParts[1] - 1, day: +dateParts[2] };
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

    public toDate(parted: PartedDate): Date {
        if (parted.day && parted.month) {
            return new Date(parted.year, parted.month - 1, parted.day + 1);
        } else if (parted.month) {
            return new Date(parted.year, parted.month - 1, 1);
        } else {
            return new Date(parted.year, 0, 1);
        }
    }

    public isDateTargetYear(date: PartedDate): boolean {
        return date.year !== undefined && date.month === undefined && date.day === undefined;
    }

    public isDateTargetMonth(date: PartedDate): boolean {
        return date.year !== undefined && date.month !== undefined && date.day === undefined;
    }

    public isDateTargetDay(date: PartedDate): boolean {
        return date.year !== undefined && date.month !== undefined && date.day !== undefined;
    }
}
