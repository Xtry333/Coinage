import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetCreatedDateToCurrent1636045473486 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`transfer\`
            CHANGE COLUMN \`created_date\` \`created_date\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP();
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('');
    }
}
