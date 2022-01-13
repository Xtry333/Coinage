import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatedDateToAccounts1642036120866 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`account\`
            ADD COLUMN \`created_date\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP();
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('account', 'created_date');
    }
}
