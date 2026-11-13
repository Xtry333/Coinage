import { getMetadataStorage } from 'typeorm';

import { Account } from '../entities/Account.entity';
import { Category } from '../entities/Category.entity';
import { Contractor } from '../entities/Contractor.entity';
import { Receipt } from '../entities/Receipt.entity';
import { Schedule } from '../entities/Schedule.entity';
import { Transfer } from '../entities/Transfer.entity';
import { User } from '../entities/User.entity';

describe('PostgreSQL entity metadata', () => {
    let entityMetadatas: ReturnType<typeof getMetadataStorage>['tables'];

    beforeAll(() => {
        entityMetadatas = getMetadataStorage().tables;
    });

    it('does not use MySQL-specific BIT column type (Postgres uses boolean)', () => {
        const bitColumns = entityMetadatas.flatMap((table) => table.columns.filter((col) => col.type === 'bit'));

        expect(bitColumns).toHaveLength(0);
    });

    it('does not use MySQL-specific longtext column type (Postgres uses text)', () => {
        const longtextColumns = entityMetadatas.flatMap((table) => table.columns.filter((col) => col.type === 'longtext'));

        expect(longtextColumns).toHaveLength(0);
    });

    it('Account entity uses boolean for is_active and is_contractor_account', () => {
        const accountMeta = entityMetadatas.find((t) => t.target === Account);
        const isActiveCol = accountMeta?.columns.find((c) => c.propertyName === 'isActive');
        const isContractorCol = accountMeta?.columns.find((c) => c.propertyName === 'isContractorAccount');

        expect(isActiveCol?.type).toBe('boolean');
        expect(isContractorCol?.type).toBe('boolean');
    });

    it('Contractor entity uses boolean for is_active', () => {
        const contractorMeta = entityMetadatas.find((t) => t.target === Contractor);
        const isActiveCol = contractorMeta?.columns.find((c) => c.propertyName === 'isActive');

        expect(isActiveCol?.type).toBe('boolean');
    });

    it('Transfer entity uses boolean for is_ethereal and is_flagged', () => {
        const transferMeta = entityMetadatas.find((t) => t.target === Transfer);
        const isEtherealCol = transferMeta?.columns.find((c) => c.propertyName === 'isEthereal');
        const isFlaggedCol = transferMeta?.columns.find((c) => c.propertyName === 'isFlagged');

        expect(isEtherealCol?.type).toBe('boolean');
        expect(isFlaggedCol?.type).toBe('boolean');
    });

    it('Transfer entity uses jsonb for metadata (not json with json_object() default)', () => {
        const transferMeta = entityMetadatas.find((t) => t.target === Transfer);
        const metadataCol = transferMeta?.columns.find((c) => c.propertyName === 'metadata');

        expect(metadataCol?.type).toBe('jsonb');
        // TypeORM stores the raw default value string as written in the decorator
        expect(metadataCol?.default).toBe('{}');
    });

    it('User entity uses boolean for is_system_user', () => {
        const userMeta = entityMetadatas.find((t) => t.target === User);
        const isSystemUserCol = userMeta?.columns.find((c) => c.propertyName === 'isSystemUser');

        expect(isSystemUserCol?.type).toBe('boolean');
    });

    it('Receipt entity uses text for raw_ai_response (not longtext)', () => {
        const receiptMeta = entityMetadatas.find((t) => t.target === Receipt);
        const rawAiCol = receiptMeta?.columns.find((c) => c.propertyName === 'rawAiResponse');

        expect(rawAiCol?.type).toBe('text');
    });

    it('all enum columns use a CHECK-compatible string type (varchar/text), not MySQL ENUM', () => {
        const enumColumns = entityMetadatas.flatMap((table) => table.columns.filter((col) => col.type === 'enum' && col.length === undefined));

        // TypeORM maps 'enum' column type to either a DB enum or a check constraint.
        // For Postgres we use VARCHAR + CHECK in the baseline migration, so TypeORM
        // should not emit native MySQL ENUM metadata.
        expect(enumColumns).toHaveLength(0);
    });

    it('all expected entities are registered', () => {
        const registeredTargets = entityMetadatas.map((t) => t.target);
        expect(registeredTargets).toContain(Account);
        expect(registeredTargets).toContain(Category);
        expect(registeredTargets).toContain(Contractor);
        expect(registeredTargets).toContain(Receipt);
        expect(registeredTargets).toContain(Schedule);
        expect(registeredTargets).toContain(Transfer);
        expect(registeredTargets).toContain(User);
    });
});
