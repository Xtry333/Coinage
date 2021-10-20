import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccountIsActive1634246370948 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `account` ADD COLUMN `is_active` BIT(1) NOT NULL DEFAULT 1');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('account', 'is_active');
    }
}
