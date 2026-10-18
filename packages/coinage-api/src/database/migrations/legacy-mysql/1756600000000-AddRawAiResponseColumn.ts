import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRawAiResponseColumn1756600000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE receipt ADD COLUMN raw_ai_response LONGTEXT NULL DEFAULT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE receipt DROP COLUMN raw_ai_response`);
    }
}
