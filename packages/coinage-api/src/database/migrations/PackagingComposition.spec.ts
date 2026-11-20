import { QueryRunner } from 'typeorm';

import { AddPackagingComposition1795176001000 } from './1795176001000-AddPackagingComposition';

describe('packaging composition migration', () => {
    it('adds names and guarded same-product self references without changing old containers or measurements', async () => {
        const query = jest.fn().mockResolvedValue(undefined);
        await new AddPackagingComposition1795176001000().up({ query } as unknown as QueryRunner);
        const sql = query.mock.calls.map(([statement]) => statement).join('\n');
        expect(sql).toContain('FOREIGN KEY (contained_packaging_id, item_id) REFERENCES item_packaging(id, item_id) ON DELETE RESTRICT');
        expect(sql).toContain('contained_count IS NOT NULL AND contained_count > 0');
        expect(sql).toContain('PERFORM 1 FROM item WHERE id = NEW.item_id FOR UPDATE');
        expect(sql).toContain('CREATE VIEW item_packaging_contents');
        expect(sql).toContain('WITH RECURSIVE');
        expect(sql).toContain('p.name AS container_name');
        expect(sql).not.toMatch(/(?:UPDATE|ALTER TABLE|DROP TABLE)\s+container\b/i);
        expect(sql).not.toMatch(/UPDATE item_packaging\s+(?:p\s+)?SET\s+(?:weight|volume|item_count)\s*=/i);
    });

    it('refuses to discard nested packaging during a lossy rollback', async () => {
        await expect(new AddPackagingComposition1795176001000().down()).rejects.toThrow('Restore a database backup');
    });
});
