import { DateParserService } from './date-parser.service';

describe('DateParserService', () => {
    let service: DateParserService;

    beforeEach(() => {
        service = new DateParserService();
    });

    describe('formatMySql', () => {
        it('formats a date to YYYY-MM-DD using UTC', () => {
            const date = new Date('2024-03-15T12:30:00Z');
            expect(service.formatMySql(date)).toBe('2024-03-15');
        });

        it('pads single-digit months and days to two digits', () => {
            const date = new Date('2024-01-05T00:00:00Z');
            expect(service.formatMySql(date)).toBe('2024-01-05');
        });

        it('uses UTC date not local date', () => {
            // A date that is Dec 31 UTC even though it might be Jan 1 in +14 timezone
            const date = new Date('2024-12-31T23:00:00Z');
            expect(service.formatMySql(date)).toBe('2024-12-31');
        });
    });

    describe('toUTCString', () => {
        it('formats date as UTC year-month-day without zero-padding', () => {
            const date = new Date('2024-03-15T00:00:00Z');
            expect(service.toUTCString(date)).toBe('2024-3-15');
        });

        it('returns non-zero-padded month and day for December 31', () => {
            const date = new Date('2024-12-31T00:00:00Z');
            expect(service.toUTCString(date)).toBe('2024-12-31');
        });

        it('returns non-zero-padded month for January', () => {
            const date = new Date('2024-01-07T00:00:00Z');
            expect(service.toUTCString(date)).toBe('2024-1-7');
        });
    });

    describe('getEndOfMonth', () => {
        it('returns January 31 for month index 0', () => {
            const result = service.getEndOfMonth(2024, 0);
            expect(result.getFullYear()).toBe(2024);
            expect(result.getMonth()).toBe(0);
            expect(result.getDate()).toBe(31);
        });

        it('returns February 29 for a leap year (month index 1)', () => {
            const result = service.getEndOfMonth(2024, 1);
            expect(result.getFullYear()).toBe(2024);
            expect(result.getMonth()).toBe(1);
            expect(result.getDate()).toBe(29);
        });

        it('returns February 28 for a non-leap year', () => {
            const result = service.getEndOfMonth(2023, 1);
            expect(result.getDate()).toBe(28);
            expect(result.getMonth()).toBe(1);
        });

        it('returns December 31 for month index 11', () => {
            const result = service.getEndOfMonth(2024, 11);
            expect(result.getDate()).toBe(31);
            expect(result.getMonth()).toBe(11);
            expect(result.getFullYear()).toBe(2024);
        });

        it('returns April 30 for month index 3', () => {
            const result = service.getEndOfMonth(2024, 3);
            expect(result.getDate()).toBe(30);
            expect(result.getMonth()).toBe(3);
        });
    });

    describe('getEndOfMonthSeconds', () => {
        it('returns 23:59:59.999 on the last day of January (month index 0)', () => {
            const result = service.getEndOfMonthSeconds(2024, 0);
            expect(result.getDate()).toBe(31);
            expect(result.getMonth()).toBe(0);
            expect(result.getHours()).toBe(23);
            expect(result.getMinutes()).toBe(59);
            expect(result.getSeconds()).toBe(59);
            expect(result.getMilliseconds()).toBe(999);
        });

        it('returns one millisecond before the first day of the next month', () => {
            const result = service.getEndOfMonthSeconds(2024, 1); // End of Feb 2024
            // Feb 29 23:59:59.999 (leap year)
            expect(result.getDate()).toBe(29);
            expect(result.getMonth()).toBe(1);
            expect(result.getMilliseconds()).toBe(999);
        });
    });

    describe('getStartOfNextMonthDate', () => {
        it('returns the 1st day of the next month', () => {
            const now = new Date();
            const result = service.getStartOfNextMonthDate();
            const expectedMonth = (now.getMonth() + 1) % 12;
            expect(result.getDate()).toBe(1);
            expect(result.getMonth()).toBe(expectedMonth);
        });

        it('returns a date in the future compared to now', () => {
            const now = new Date();
            const result = service.getStartOfNextMonthDate();
            expect(result.getTime()).toBeGreaterThan(now.getTime());
        });
    });

    describe('getEndOfCurrentMonthDate', () => {
        it('returns a date in the current month', () => {
            const now = new Date();
            const result = service.getEndOfCurrentMonthDate();
            expect(result.getMonth()).toBe(now.getMonth());
            expect(result.getFullYear()).toBe(now.getFullYear());
        });

        it('returns the last day of the current month (next day is in next month)', () => {
            const now = new Date();
            const result = service.getEndOfCurrentMonthDate();
            const nextDay = new Date(result);
            nextDay.setDate(result.getDate() + 1);
            expect(nextDay.getMonth()).not.toBe(now.getMonth());
        });
    });

    describe('getToday', () => {
        it('returns a string matching YYYY-M-D format for today', () => {
            const today = new Date();
            const expected = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
            expect(service.getToday()).toBe(expected);
        });

        it('returns a string with year, month, and day separated by dashes', () => {
            const result = service.getToday();
            expect(result).toMatch(/^\d{4}-\d{1,2}-\d{1,2}$/);
        });
    });
});
