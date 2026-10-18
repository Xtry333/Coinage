import { MigrationInterface, QueryRunner } from "typeorm";

export class AddContainerTable1745336625326 implements MigrationInterface {
    name = 'AddContainerTable1745336625326'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`container\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(64) NULL, \`weight\` float NULL, \`weight_unit\` varchar(8) NULL, \`volume\` float NULL, \`volume_unit\` varchar(8) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`transfer_item\` ADD \`container_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`item\` CHANGE \`category_id\` \`category_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`item\` ADD CONSTRAINT \`FK_item_category_id_REF_category_id\` FOREIGN KEY (\`category_id\`) REFERENCES \`category\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`transfer_item\` ADD CONSTRAINT \`FK_transfer_item_container_id_REF_container_id\` FOREIGN KEY (\`container_id\`) REFERENCES \`container\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transfer_item\` DROP FOREIGN KEY \`FK_transfer_item_container_id_REF_container_id\``);
        await queryRunner.query(`ALTER TABLE \`item\` ADD \`category_id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`item\` DROP FOREIGN KEY \`FK_item_category_id_REF_category_id\``);
        await queryRunner.query(`ALTER TABLE \`transfer_item\` DROP COLUMN \`container_id\``);
        await queryRunner.query(`DROP TABLE \`container\``);
    }

}
