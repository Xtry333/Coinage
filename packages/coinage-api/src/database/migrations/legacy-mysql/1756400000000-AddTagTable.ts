import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTagTable1756400000000 implements MigrationInterface {
    name = 'AddTagTable1756400000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE \`tag\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(64) NOT NULL, \`color\` varchar(7) NULL, UNIQUE INDEX \`UQ_tag_name\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `CREATE TABLE \`item_tag\` (\`item_id\` int NOT NULL, \`tag_id\` int NOT NULL, INDEX \`IDX_item_tag_ON_item_id\` (\`item_id\`), INDEX \`IDX_item_tag_ON_tag_id\` (\`tag_id\`), PRIMARY KEY (\`item_id\`, \`tag_id\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `ALTER TABLE \`item_tag\` ADD CONSTRAINT \`FK_item_tag_item_id_REF_item_id\` FOREIGN KEY (\`item_id\`) REFERENCES \`item\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
        );
        await queryRunner.query(
            `ALTER TABLE \`item_tag\` ADD CONSTRAINT \`FK_item_tag_tag_id_REF_tag_id\` FOREIGN KEY (\`tag_id\`) REFERENCES \`tag\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`item_tag\` DROP FOREIGN KEY \`FK_item_tag_tag_id_REF_tag_id\``);
        await queryRunner.query(`ALTER TABLE \`item_tag\` DROP FOREIGN KEY \`FK_item_tag_item_id_REF_item_id\``);
        await queryRunner.query(`DROP INDEX \`IDX_item_tag_ON_tag_id\` ON \`item_tag\``);
        await queryRunner.query(`DROP INDEX \`IDX_item_tag_ON_item_id\` ON \`item_tag\``);
        await queryRunner.query(`DROP TABLE \`item_tag\``);
        await queryRunner.query(`DROP INDEX \`UQ_tag_name\` ON \`tag\``);
        await queryRunner.query(`DROP TABLE \`tag\``);
    }
}
