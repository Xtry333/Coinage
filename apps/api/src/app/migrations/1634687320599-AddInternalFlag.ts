import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInternalFlag1634687320599 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `transfer` ADD COLUMN `is_internal` BIT(1) NOT NULL DEFAULT 0');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('transfer', 'is_internal');
    }
}
