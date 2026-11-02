import { MigrationInterface, QueryRunner } from "typeorm";

export class AddContainerTable1745336625326 implements MigrationInterface {
    name = 'AddContainerTable1745336625326'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (!(await queryRunner.hasTable('container'))) {
            await queryRunner.query(
                `CREATE TABLE \`container\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(64) NULL, \`weight\` float NULL, \`weight_unit\` varchar(8) NULL, \`volume\` float NULL, \`volume_unit\` varchar(8) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
            );
        }
        if (!(await queryRunner.hasColumn('transfer_item', 'container_id'))) {
            await queryRunner.query(`ALTER TABLE \`transfer_item\` ADD \`container_id\` int NULL`);
        }
        if (!(await queryRunner.hasColumn('item', 'category_id'))) {
            await queryRunner.query(`ALTER TABLE \`item\` ADD \`category_id\` int NULL`);
        } else {
            await queryRunner.query(`ALTER TABLE \`item\` MODIFY \`category_id\` int NULL`);
        }
        if (!(await queryRunner.hasColumn('item', 'brand'))) {
            await queryRunner.query(`ALTER TABLE \`item\` ADD \`brand\` varchar(50) NULL`);
        }
        if (!(await queryRunner.hasColumn('item', 'container_size'))) {
            await queryRunner.query(`ALTER TABLE \`item\` ADD \`container_size\` float NULL`);
        }
        if (!(await queryRunner.hasColumn('item', 'container_size_unit'))) {
            await queryRunner.query(`ALTER TABLE \`item\` ADD \`container_size_unit\` varchar(16) NULL`);
        }
        const itemTable = await queryRunner.getTable('item');
        if (!itemTable?.foreignKeys.some((foreignKey) => foreignKey.name === 'FK_item_category_id_REF_category_id')) {
            await queryRunner.query(
                `ALTER TABLE \`item\` ADD CONSTRAINT \`FK_item_category_id_REF_category_id\` FOREIGN KEY (\`category_id\`) REFERENCES \`category\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`,
            );
        }
        const transferItemTable = await queryRunner.getTable('transfer_item');
        if (!transferItemTable?.foreignKeys.some((foreignKey) => foreignKey.name === 'FK_transfer_item_container_id_REF_container_id')) {
            await queryRunner.query(
                `ALTER TABLE \`transfer_item\` ADD CONSTRAINT \`FK_transfer_item_container_id_REF_container_id\` FOREIGN KEY (\`container_id\`) REFERENCES \`container\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE`,
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transfer_item\` DROP FOREIGN KEY \`FK_transfer_item_container_id_REF_container_id\``);
        await queryRunner.query(`ALTER TABLE \`item\` ADD \`category_id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`item\` DROP FOREIGN KEY \`FK_item_category_id_REF_category_id\``);
        await queryRunner.query(`ALTER TABLE \`transfer_item\` DROP COLUMN \`container_id\``);
        await queryRunner.query(`DROP TABLE \`container\``);
    }

}
