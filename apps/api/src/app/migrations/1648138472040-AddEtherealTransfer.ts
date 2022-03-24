import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEtherealTransfer1648138472040 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `transfer` ADD COLUMN `is_ethereal` BIT(1) NOT NULL DEFAULT 0');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('transfer', 'is_ethereal');
    }
}
