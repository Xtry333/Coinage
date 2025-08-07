import { MigrationInterface, QueryRunner } from "typeorm";

export class AddItemCount1751894045445 implements MigrationInterface {
    name = 'AddItemCount1751894045445'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`container\` ADD \`item_count\` int NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`container\` DROP COLUMN \`item_count\``);
    }

}
