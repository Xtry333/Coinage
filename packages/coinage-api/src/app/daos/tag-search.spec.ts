import { DataSource, FindOptionsWhere } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { ItemDao } from './item.dao';
import { TransferDao } from './transfer.dao';
import entities from '../entities/_index';
import { Item } from '../entities/Item.entity';
import { Transfer } from '../entities/Transfer.entity';
import { TemplateNameMapperService } from '../services/template-name-mapper.service';

class MetadataDataSource extends DataSource {
    public prepareMetadata(): Promise<void> {
        return this.buildMetadatas();
    }
}

describe('PostgreSQL tag queries and many-to-many metadata', () => {
    let source: MetadataDataSource;
    const mapper = { mapTransfersTemplateNames: jest.fn() } as unknown as TemplateNameMapperService;

    beforeAll(async () => {
        source = new MetadataDataSource({
            type: 'postgres',
            entities,
            namingStrategy: new SnakeNamingStrategy(),
        });
        await source.prepareMetadata();
    });

    afterEach(() => jest.restoreAllMocks());

    it('defines composite primary keys and cascade cleanup for both assignment tables', () => {
        for (const [entity, table, ownerId] of [
            [Item, 'item_tag', 'item_id'],
            [Transfer, 'transfer_tag', 'transfer_id'],
        ] as const) {
            const relation = source.getMetadata(entity).relations.find((candidate) => candidate.propertyName === 'tags');
            expect(relation?.junctionEntityMetadata?.tableName).toBe(table);
            expect(relation?.junctionEntityMetadata?.primaryColumns.map((column) => column.databaseName)).toEqual([ownerId, 'tag_id']);
            expect(relation?.junctionEntityMetadata?.foreignKeys.every((key) => key.onDelete === 'CASCADE')).toBe(true);
        }
    });

    it('uses the same non-multiplying tag conditions for pages and counts, with all filters retained', async () => {
        const repository = source.getRepository(Transfer);
        const find = jest.spyOn(repository, 'find').mockResolvedValue([]);
        const count = jest.spyOn(repository, 'count').mockResolvedValue(0);
        const dao = new TransferDao(repository, mapper);
        const filter = {
            page: 2,
            rowsPerPage: 10,
            tagIds: [4, 4, 5],
            transferIds: [20],
            accountIds: [7],
            categoryIds: [2],
            contractorIds: [3],
            description: 'Lunch',
        };
        await dao.getAllFilteredPaged(filter);
        await dao.getAllFilteredCount(filter);

        const options = find.mock.calls[0][0] ?? {};
        expect(options.take).toBe(10);
        expect(options.skip).toBe(10);
        const [sql, parameters] = repository.createQueryBuilder('transfer').setFindOptions(options).getQueryAndParameters();
        const countSql = repository
            .createQueryBuilder('transfer')
            .setFindOptions(count.mock.calls[0][0] ?? {})
            .getSql();
        expect(sql).toContain('FROM transfer_tag search_transfer_tag');
        expect(sql).toContain('FROM transfer_item search_transfer_item');
        expect(sql).toContain('JOIN item_tag search_item_tag');
        expect(sql).toContain('search_tag.id IN (');
        expect(sql).toContain('"transfer"."account_id"');
        expect(sql).toContain('"transfer"."target_account_id"');
        expect(sql).toContain('"transfer"."category_id"');
        expect(sql).toContain('"transfer"."contractor_id"');
        expect(sql).toContain('"transfer"."description" ILIKE');
        const whereClause = (statement: string) => statement.slice(statement.indexOf(' WHERE ')).split(' ORDER BY ')[0];
        expect(whereClause(countSql)).toBe(whereClause(sql));
        expect(parameters).toContain(20);
        expect(parameters).toContain('%Lunch%');
        // Tag matching is in subqueries; eager joins still load the entire tag collection.
        expect(sql).toContain('LEFT JOIN "transfer_tag"');
        expect(sql).toContain('LEFT JOIN "item_tag"');
    });

    it('keeps global tag searches scoped to source or target accounts, with parameterized names', async () => {
        const repository = source.getRepository(Transfer);
        const find = jest.spyOn(repository, 'find').mockResolvedValue([]);
        const dao = new TransferDao(repository, mapper);
        const query = "'; DROP TABLE tag; --";
        await dao.searchByDescription(query, [7, 8], 5);
        const options = find.mock.calls[0][0] ?? {};
        const where = options.where as FindOptionsWhere<Transfer>[];
        expect(where).toHaveLength(4);
        expect(where.every((condition) => 'originAccountId' in condition || 'targetAccountId' in condition)).toBe(true);
        const [sql, parameters] = repository.createQueryBuilder('transfer').setFindOptions(options).getQueryAndParameters();
        expect(sql).toContain('search_tag.name ILIKE');
        expect(sql).not.toContain(query);
        expect(parameters).toContain(`%${query}%`);
        expect(options.take).toBe(5);
    });

    it.each([{ tagIds: [] }, { tagIds: [4, 4, 5] }])('excludes direct and inherited tags for pages and counts with inclusions $tagIds', async ({ tagIds }) => {
        const repository = source.getRepository(Transfer);
        const find = jest.spyOn(repository, 'find').mockResolvedValue([]);
        const count = jest.spyOn(repository, 'count').mockResolvedValue(0);
        const dao = new TransferDao(repository, mapper);
        const filter = {
            page: 1,
            rowsPerPage: 10,
            tagIds,
            excludedTagIds: [9, 9],
            transferIds: [20],
            accountIds: [7],
        };
        await dao.getAllFilteredPaged(filter);
        await dao.getAllFilteredCount(filter);

        const options = find.mock.calls[0][0] ?? {};
        const where = options.where as FindOptionsWhere<Transfer>[];
        expect(where).toHaveLength(2);
        const [sql, parameters] = repository.createQueryBuilder('transfer').setFindOptions(options).getQueryAndParameters();
        const whereClause = (statement: string) => statement.slice(statement.indexOf(' WHERE ')).split(' ORDER BY ')[0];
        const countSql = repository
            .createQueryBuilder('transfer')
            .setFindOptions(count.mock.calls[0][0] ?? {})
            .getSql();
        expect(whereClause(countSql)).toBe(whereClause(sql));
        expect(sql).toMatch(/NOT \(\s*EXISTS \([\s\S]*FROM transfer_tag[\s\S]*OR EXISTS \([\s\S]*JOIN item_tag/);
        // Each account branch checks both direct and inherited tags with one deduplicated excluded ID.
        expect(parameters.filter((parameter) => parameter === 9)).toHaveLength(4);
        expect(parameters).toContain(20);
        expect(parameters).toContain(7);
        if (tagIds.length) {
            expect(sql).toMatch(/\)\s*AND NOT \(/);
            expect(parameters).toContain(4);
            expect(parameters).toContain(5);
        }
        expect(sql).not.toContain('IN ()');
    });

    it('ignores empty included and excluded tag sets', async () => {
        const repository = source.getRepository(Transfer);
        const find = jest.spyOn(repository, 'find').mockResolvedValue([]);
        await new TransferDao(repository, mapper).getAllFilteredPaged({ page: 1, rowsPerPage: 10, tagIds: [], excludedTagIds: [] });
        const sql = repository
            .createQueryBuilder('transfer')
            .setFindOptions(find.mock.calls[0][0] ?? {})
            .getSql();
        expect(sql).not.toContain('search_transfer_tag');
        expect(sql).not.toContain('IN ()');
    });

    it('returns no transfer search results for users with no accounts', async () => {
        const repository = source.getRepository(Transfer);
        const find = jest.spyOn(repository, 'find');
        const dao = new TransferDao(repository, mapper);
        expect(await dao.searchByDescription('Holiday', [], 5)).toEqual([]);
        expect(find).not.toHaveBeenCalled();
    });

    it('searches item tags without filtering the eager tags being returned', async () => {
        const repository = source.getRepository(Item);
        const find = jest.spyOn(repository, 'find').mockResolvedValue([]);
        const dao = new ItemDao(repository);
        await dao.searchByNameOrBrand('Holiday', 10);
        const options = find.mock.calls[0][0] ?? {};
        const [sql, parameters] = repository.createQueryBuilder('item').setFindOptions(options).getQueryAndParameters();
        expect(sql).toContain('"item"."name" ILIKE');
        expect(sql).toContain('"item"."brand" ILIKE');
        expect(sql).toContain('search_tag.name ILIKE');
        expect(sql).toContain('LEFT JOIN "item_tag"');
        expect(parameters).toContain('%Holiday%');
    });

    it('explicitly loads direct and inherited tags for query-builder based recent transfers', async () => {
        const repository = source.getRepository(Transfer);
        const builder = repository.createQueryBuilder('transfer');
        jest.spyOn(repository, 'createQueryBuilder').mockReturnValue(builder);
        jest.spyOn(builder, 'getMany').mockResolvedValue([]);
        await new TransferDao(repository, mapper).getRecentlyEditedTransfersForUser(7, 10);
        const sql = builder.getSql();
        expect(sql).toContain('LEFT JOIN "transfer_tag"');
        expect(sql).toContain('LEFT JOIN "transfer_item"');
        expect(sql).toContain('LEFT JOIN "item_tag"');
        expect(sql).toContain('"itemTags"."name"');
    });
});
