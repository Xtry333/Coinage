import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateContainersView1755864881273 implements MigrationInterface {
    name = 'UpdateContainersView1755864881273';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE VIEW \`items_with_containers\` AS 
SELECT 
    item.id AS item_id,
    item.brand AS item_brand,
    item.name AS item_name,
    item.category_id AS item_category_id,
    item.container_size AS item_container_size,
    item.container_size_unit AS item_container_size_unit,
    item.created_date AS item_created_date,
    item.edited_date AS item_updated_date,
    container.id AS container_id,
    container.name AS container_name,
    container.weight AS container_weight,
    container.weight_unit AS container_weight_unit,
    container.volume AS container_volume,
    container.volume_unit AS container_volume_unit,
    container.item_count AS container_item_count
FROM item 
JOIN transfer_item ON item.id = transfer_item.item_id
JOIN container ON container.id = transfer_item.container_id
GROUP BY item.id, container.id`);
        await queryRunner.query(
            `INSERT INTO \`coinage-db\`.\`typeorm_metadata\`(\`database\`, \`schema\`, \`table\`, \`type\`, \`name\`, \`value\`) VALUES (DEFAULT, ?, DEFAULT, ?, ?, ?)`,
            [
                'coinage-db',
                'VIEW',
                'items_with_containers',
                'SELECT \n    item.id AS item_id,\n    item.brand AS item_brand,\n    item.name AS item_name,\n    item.category_id AS item_category_id,\n    item.container_size AS item_container_size,\n    item.container_size_unit AS item_container_size_unit,\n    item.created_date AS item_created_date,\n    item.edited_date AS item_updated_date,\n    container.id AS container_id,\n    container.name AS container_name,\n    container.weight AS container_weight,\n    container.weight_unit AS container_weight_unit,\n    container.volume AS container_volume,\n    container.volume_unit AS container_volume_unit,\n    container.item_count AS container_item_count\nFROM item \nJOIN transfer_item ON item.id = transfer_item.item_id\nJOIN container ON container.id = transfer_item.container_id\nGROUP BY item.id, container.id',
            ],
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM \`coinage-db\`.\`typeorm_metadata\` WHERE \`type\` = ? AND \`name\` = ? AND \`schema\` = ?`, [
            'VIEW',
            'items_with_containers',
            'coinage-db',
        ]);
        await queryRunner.query(`DROP VIEW \`items_with_containers\``);
    }
}
