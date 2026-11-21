import { QueryRunner } from 'typeorm';

import { AddItemIsArchived1795219200000 } from './1795219200000-AddItemIsArchived';

describe('AddItemIsArchived migration', () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const runner = { query } as unknown as QueryRunner;

    beforeEach(() => query.mockClear());

    it('adds a non-null archive flag defaulting to false', async () => {
        await new AddItemIsArchived1795219200000().up(runner);

        expect(query).toHaveBeenCalledWith('ALTER TABLE item ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE');
    });

    it('drops the archive flag on rollback', async () => {
        await new AddItemIsArchived1795219200000().down(runner);

        expect(query).toHaveBeenCalledWith('ALTER TABLE item DROP COLUMN is_archived');
    });
});
