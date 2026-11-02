import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTransferAccountingDate1793491204000 implements MigrationInterface {
    public name = 'AddTransferAccountingDate1793491204000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (!(await queryRunner.hasColumn('transfer', 'accounting_date'))) {
            await queryRunner.query(`ALTER TABLE "transfer" ADD "accounting_date" date NULL`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (await queryRunner.hasColumn('transfer', 'accounting_date')) {
            await queryRunner.query(`ALTER TABLE "transfer" DROP COLUMN "accounting_date"`);
        }
    }
}
