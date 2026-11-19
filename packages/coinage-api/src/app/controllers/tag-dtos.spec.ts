import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateEditTagDTO, GetFilteredTransfersRequest, SetTagIdsDTO } from '@app/interfaces';

describe('tag request validation', () => {
    it('trims names and accepts supported tag colors', async () => {
        const dto = plainToInstance(CreateEditTagDTO, { name: '  Holiday  ', color: '#12Ab34' });
        expect(await validate(dto)).toEqual([]);
        expect(dto.name).toBe('Holiday');
    });

    it.each([
        { name: ' ' },
        { name: 'a'.repeat(65) },
        { name: 4 },
        { name: 'Holiday', color: 'red' },
        { name: 'Holiday', color: '#fff' },
        { name: 'Holiday', id: -1 },
    ])('rejects invalid tag definitions %p', async (body) => {
        expect(await validate(plainToInstance(CreateEditTagDTO, body))).not.toHaveLength(0);
    });

    it.each([{ tagIds: null }, {}, { tagIds: [0] }, { tagIds: ['1'] }, { tagIds: [1.5] }, { tagIds: '1' }])(
        'rejects malformed assignment sets %p',
        async (body) => {
            expect(await validate(plainToInstance(SetTagIdsDTO, body))).not.toHaveLength(0);
        },
    );

    it('accepts empty sets and duplicate IDs which are normalized by persistence', async () => {
        expect(await validate(plainToInstance(SetTagIdsDTO, { tagIds: [] }))).toEqual([]);
        expect(await validate(plainToInstance(SetTagIdsDTO, { tagIds: [1, 1] }))).toEqual([]);
    });

    it('validates tag IDs on paged transfer searches', async () => {
        const dto = plainToInstance(GetFilteredTransfersRequest, { page: 1, rowsPerPage: 10, tagIds: [-1] });
        expect((await validate(dto)).some((error) => error.property === 'tagIds')).toBe(true);
    });
});
