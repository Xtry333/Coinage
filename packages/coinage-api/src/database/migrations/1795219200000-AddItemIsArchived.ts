import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddItemIsArchived1795219200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE item ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE item DROP COLUMN is_archived`);
    }
}
