import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountNotNullable1637796359852 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transfer\`
            CHANGE COLUMN \`account_id\` \`account_id\` INT(10);`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(``);
    }
}
