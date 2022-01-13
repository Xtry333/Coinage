import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryTag1641651157712 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `category` ADD COLUMN `tag` VARCHAR(64) UNIQUE;');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `category` DROP COLUMN `tag`;');
    }
}
