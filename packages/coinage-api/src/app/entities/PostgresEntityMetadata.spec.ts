import { getMetadataArgsStorage } from 'typeorm';

import { Account } from '../entities/Account.entity';
import { Category } from '../entities/Category.entity';
import { Contractor } from '../entities/Contractor.entity';
import { Receipt } from '../entities/Receipt.entity';
import { Schedule } from '../entities/Schedule.entity';
import { Transfer } from '../entities/Transfer.entity';
import { User } from '../entities/User.entity';

describe('PostgreSQL entity metadata', () => {
    let metadata: ReturnType<typeof getMetadataArgsStorage>;

    beforeAll(() => {
        metadata = getMetadataArgsStorage();
    });

    it('does not use MySQL-specific BIT column type (Postgres uses boolean)', () => {
        const bitColumns = metadata.columns.filter((col) => col.options.type === 'bit');

        expect(bitColumns).toHaveLength(0);
    });

    it('does not use MySQL-specific longtext column type (Postgres uses text)', () => {
        const longtextColumns = metadata.columns.filter((col) => col.options.type === 'longtext');

        expect(longtextColumns).toHaveLength(0);
    });

    it('Account entity uses boolean for is_active and is_contractor_account', () => {
        const columns = metadata.filterColumns(Account);
        const isActiveCol = columns.find((c) => c.propertyName === 'isActive');
        const isContractorCol = columns.find((c) => c.propertyName === 'isContractorAccount');

        expect(isActiveCol?.options.type).toBe('boolean');
        expect(isContractorCol?.options.type).toBe('boolean');
    });

    it('Contractor entity uses boolean for is_active', () => {
        const isActiveCol = metadata.filterColumns(Contractor).find((c) => c.propertyName === 'isActive');

        expect(isActiveCol?.options.type).toBe('boolean');
    });

    it('Transfer entity uses boolean for is_ethereal and is_flagged', () => {
        const columns = metadata.filterColumns(Transfer);
        const isEtherealCol = columns.find((c) => c.propertyName === 'isEthereal');
        const isFlaggedCol = columns.find((c) => c.propertyName === 'isFlagged');

        expect(isEtherealCol?.options.type).toBe('boolean');
        expect(isFlaggedCol?.options.type).toBe('boolean');
    });

    it('Transfer entity uses jsonb for metadata (not json with json_object() default)', () => {
        const metadataCol = metadata.filterColumns(Transfer).find((c) => c.propertyName === 'metadata');

        expect(metadataCol?.options.type).toBe('jsonb');
        // TypeORM stores the raw default value string as written in the decorator
        expect(metadataCol?.options.default).toBe('{}');
    });

    it('User entity uses boolean for is_system_user', () => {
        const isSystemUserCol = metadata.filterColumns(User).find((c) => c.propertyName === 'isSystemUser');

        expect(isSystemUserCol?.options.type).toBe('boolean');
    });

    it('Receipt entity uses text for raw_ai_response (not longtext)', () => {
        const rawAiCol = metadata.filterColumns(Receipt).find((c) => c.propertyName === 'rawAiResponse');

        expect(rawAiCol?.options.type).toBe('text');
    });

    it('does not declare native enums for the VARCHAR/CHECK schema', () => {
        const enumColumns = metadata.columns.filter((col) => col.options.type === 'enum');

        // The baseline migration owns the CHECK constraints; entity metadata must
        // describe those columns as strings rather than PostgreSQL native enums.
        expect(enumColumns).toHaveLength(0);
    });

    it.each([
        [Category, 'type', 10, 'OUTCOME'],
        [Transfer, 'type', 10, 'OUTCOME'],
        [Schedule, 'recurrence', 10, 'MONTHLY'],
        [Receipt, 'processingStatus', 20, 'NONE'],
    ] as const)('matches the baseline string column for %p.%s', (entity, propertyName, length, defaultValue) => {
        const column = metadata.filterColumns(entity).find((c) => c.propertyName === propertyName);

        expect(column?.options).toMatchObject({ type: 'varchar', length, default: defaultValue, nullable: false });
    });

    it('all expected entities are registered', () => {
        const registeredTargets = metadata.tables.map((t) => t.target);
        expect(registeredTargets).toContain(Account);
        expect(registeredTargets).toContain(Category);
        expect(registeredTargets).toContain(Contractor);
        expect(registeredTargets).toContain(Receipt);
        expect(registeredTargets).toContain(Schedule);
        expect(registeredTargets).toContain(Transfer);
        expect(registeredTargets).toContain(User);
    });
});
