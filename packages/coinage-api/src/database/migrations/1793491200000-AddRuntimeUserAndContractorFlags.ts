import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRuntimeUserAndContractorFlags1793491200000 implements MigrationInterface {
    public name = 'AddRuntimeUserAndContractorFlags1793491200000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (!(await queryRunner.hasColumn('contractor', 'is_active'))) {
            await queryRunner.query(`ALTER TABLE "contractor" ADD "is_active" boolean NOT NULL DEFAULT true`);
        }
        if (!(await queryRunner.hasColumn('user', 'is_system_user'))) {
            await queryRunner.query(`ALTER TABLE "user" ADD "is_system_user" boolean NOT NULL DEFAULT false`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (await queryRunner.hasColumn('user', 'is_system_user')) {
            await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "is_system_user"`);
        }
        if (await queryRunner.hasColumn('contractor', 'is_active')) {
            await queryRunner.query(`ALTER TABLE "contractor" DROP COLUMN "is_active"`);
        }
    }
}
