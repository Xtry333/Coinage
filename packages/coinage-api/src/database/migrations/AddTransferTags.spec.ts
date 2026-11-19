import { QueryRunner } from 'typeorm';

import { AddTransferTags1795046400000 } from './1795046400000-AddTransferTags';

describe('AddTransferTags migration', () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const runner = { query } as unknown as QueryRunner;

    beforeEach(() => query.mockClear());

    it('adds only direct assignments with composite uniqueness and cascade cleanup', async () => {
        await new AddTransferTags1795046400000().up(runner);
        const sql = query.mock.calls.map(([statement]) => statement).join('\n');
        expect(sql).toContain('PRIMARY KEY (transfer_id, tag_id)');
        expect(sql).toContain('REFERENCES transfer(id) ON UPDATE CASCADE ON DELETE CASCADE');
        expect(sql).toContain('REFERENCES tag(id) ON UPDATE CASCADE ON DELETE CASCADE');
        expect(sql).toContain('CREATE INDEX idx_transfer_tag_tag_id');
        expect(sql).toContain('CREATE INDEX idx_item_tag_tag_id');
        expect(sql).not.toMatch(/INSERT INTO|DROP TABLE|CREATE TABLE receipt_tag|is_inherited/i);
    });

    it('rolls back the new junction without deleting the shared catalog or item assignments', async () => {
        await new AddTransferTags1795046400000().down(runner);
        const sql = query.mock.calls.map(([statement]) => statement).join('\n');
        expect(sql).toContain('DROP TABLE transfer_tag');
        expect(sql).not.toMatch(/DROP TABLE (item_tag|tag)\b/i);
        expect(sql).toContain('ON UPDATE NO ACTION ON DELETE NO ACTION');
    });
});
