import { MigrationInterface, QueryRunner } from 'typeorm';

export class NonNullTargetTransfer1678491536904 implements MigrationInterface {
    public name = 'NonNullTargetTransfer1678491536904';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transfer\` MODIFY \`target_account_id\` int NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transfer\` MODIFY \`target_account_id\` int NULL`);
    }
}
