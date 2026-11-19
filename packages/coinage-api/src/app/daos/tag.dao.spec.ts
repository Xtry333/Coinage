import { BadRequestException, NotFoundException } from '@nestjs/common';
import { In, Repository } from 'typeorm';

import { Tag } from '../entities/Tag.entity';
import { TagDao } from './tag.dao';

describe('TagDao assignment validation', () => {
    const findBy = jest.fn();
    const repository = { findBy } as unknown as Repository<Tag>;
    const dao = new TagDao(repository);
    const tag = Object.assign(new Tag(), { id: 4, name: 'Holiday', color: null });

    beforeEach(() => findBy.mockReset());

    it('deduplicates requested IDs before querying', async () => {
        findBy.mockResolvedValue([tag]);
        expect(await dao.getByIds([4, 4, 4])).toEqual([tag]);
        expect(findBy).toHaveBeenCalledWith({ id: In([4]) });
    });

    it('supports explicitly clearing all direct assignments without a query', async () => {
        expect(await dao.getByIds([])).toEqual([]);
        expect(findBy).not.toHaveBeenCalled();
    });

    it('rejects unknown tag IDs instead of silently dropping them', async () => {
        findBy.mockResolvedValue([tag]);
        await expect(dao.getByIds([4, 99])).rejects.toBeInstanceOf(NotFoundException);
    });

    const invalidIds: unknown[] = [[0], [-1], [1.5], [NaN], [Infinity], ['4'], null, '4'];
    it.each(invalidIds.map((ids) => ({ ids })))('rejects malformed IDs $ids', async ({ ids }) => {
        await expect(dao.getByIds(ids as number[])).rejects.toBeInstanceOf(BadRequestException);
        expect(findBy).not.toHaveBeenCalled();
    });
});
