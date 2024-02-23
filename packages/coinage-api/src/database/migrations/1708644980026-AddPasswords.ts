import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswords1708644980026 implements MigrationInterface {
    public name = 'AddPasswords1708644980026'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`password\` varchar(64) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`password\``);
    }

}
