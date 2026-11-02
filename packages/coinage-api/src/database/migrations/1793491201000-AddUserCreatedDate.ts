import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserCreatedDate1793491201000 implements MigrationInterface {
    public name = 'AddUserCreatedDate1793491201000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (!(await queryRunner.hasColumn('user', 'created_date'))) {
            await queryRunner.query(`ALTER TABLE \`user\` ADD \`created_date\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (await queryRunner.hasColumn('user', 'created_date')) {
            await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`created_date\``);
        }
    }
}
