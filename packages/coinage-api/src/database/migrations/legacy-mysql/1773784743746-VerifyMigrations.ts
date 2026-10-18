import { MigrationInterface, QueryRunner } from "typeorm";

export class VerifyMigrations1773784743746 implements MigrationInterface {
    name = 'VerifyMigrations1773784743746'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`SELECT 1`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
