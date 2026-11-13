import { MigrationInterface, QueryRunner } from 'typeorm';

export class NonNullTargetTransfer1678491536904 implements MigrationInterface {
    public name = 'NonNullTargetTransfer1678491536904';

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (!(await queryRunner.hasColumn('transfer', 'target_account_id'))) {
            await queryRunner.query(`ALTER TABLE \`transfer\` ADD \`target_account_id\` int NULL`);
            await queryRunner.query(`UPDATE \`transfer\` SET \`target_account_id\` = \`account_id\``);
        }
        await queryRunner.query(`ALTER TABLE \`transfer\` MODIFY \`target_account_id\` int NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transfer\` MODIFY \`target_account_id\` int NULL`);
    }
}
