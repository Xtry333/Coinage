import { MigrationInterface, QueryRunner } from "typeorm";

export class AddItemsWithContainersView1745754622461 implements MigrationInterface {
    name = 'AddItemsWithContainersView1745754622461'

    public async up(queryRunner: QueryRunner): Promise<void> {
await queryRunner.query(`CREATE VIEW \`items_with_containers\` AS 
SELECT item.id AS item_id, container.id AS container_id FROM item 
JOIN transfer_item ON item.id = transfer_item.item_id
JOIN container ON container.id = transfer_item.container_id`);
        await queryRunner.query(`INSERT INTO \`coinage-db\`.\`typeorm_metadata\`(\`database\`, \`schema\`, \`table\`, \`type\`, \`name\`, \`value\`) VALUES (DEFAULT, ?, DEFAULT, ?, ?, ?)`, ["coinage-db","VIEW","items_with_containers","SELECT item.id AS item_id, container.id AS container_id FROM item \nJOIN transfer_item ON item.id = transfer_item.item_id\nJOIN container ON container.id = transfer_item.container_id"]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM \`coinage-db\`.\`typeorm_metadata\` WHERE \`type\` = ? AND \`name\` = ? AND \`schema\` = ?`, ["VIEW","items_with_containers","coinage-db"]);
        await queryRunner.query(`DROP VIEW \`items_with_containers\``);
        }

}
