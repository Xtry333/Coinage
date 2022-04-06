/**
 * PartialDate represents a date with oprional month and day.
 *
 * @example
 * All below are valid PartialDate objects:
 * 2022
 * 2022-01
 * 2022-01-01
 * @constructor
 * @param {number} year - Full year.
 * @param {number} month - Month of the year (1-12 | undefined).
 * @param {number} day - Day of the month (1-31 | undefined).
 */
export class PartialDate {
    public static fromDate(date: Date): PartialDate {
        return new PartialDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
    }

    public static fromUTCDate(date: Date): PartialDate {
        return new PartialDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
    }

    /**
     * Full year (4 digits).
     */
    public year: number;

    /**
     * Month of the year (1-12 | undefined)
     */
    public month?: number;

    /**
     * Day of the month (1-31 | undefined)
     * @type number
     */
    public day?: number;

    constructor(year: number, month?: number, day?: number) {
        this.year = year;
        this.month = month !== 0 ? month : undefined;
        this.day = day !== 0 ? day : undefined;
    }

    /**
     * Converts this to js date and sets month/day to 1st if they are not defined.
     * @returns {Date} new Date object converted from PartialDate
     */
    public toDate(): Date {
        return new Date(this.year, this.month !== undefined ? this.month - 1 : 0, this.day);
    }

    public toInputDate(): string {
        return `${this.year}-${this.month !== undefined ? this.month.toString().padStart(2, '0') : '01'}-${
            this.day !== undefined ? this.day.toString().padStart(2, '0') : '01'
        }`;
    }

    public toString(): string {
        let dateString = this.year.toString();
        if (this.month !== undefined) {
            dateString += '-' + this.month.toString().padStart(2, '0');
            if (this.day !== undefined) {
                dateString += '-' + this.day.toString().padStart(2, '0');
            }
        }
        return dateString;
    }
}
