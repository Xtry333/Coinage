import migrations from '../database/migrations/_index';

describe('migrations', () => {
    it('exports an array of migration classes', () => {
        expect(Array.isArray(migrations)).toBe(true);
        expect(migrations.length).toBeGreaterThan(0);
    });

    it('every entry is a constructor function', () => {
        expect(migrations.every((m) => typeof m === 'function')).toBe(true);
    });

    it('migrations are ordered by timestamp (ascending)', () => {
        const timestamps = migrations.map((m) => {
            const match = m.name.match(/(\d+)$/);
            return match ? Number(match[1]) : 0;
        });
        const sorted = [...timestamps].sort((a, b) => a - b);
        expect(timestamps).toEqual(sorted);
    });
});
