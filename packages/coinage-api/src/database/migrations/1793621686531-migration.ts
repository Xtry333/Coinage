import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1793621686531 implements MigrationInterface {
    name = 'Migration1793621686531'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`item_tag\` DROP FOREIGN KEY \`FK_item_tag_tag_id_REF_tag_id\``);
        await queryRunner.query(`DROP INDEX \`UQ_tag_name\` ON \`tag\``);
        await queryRunner.query(`ALTER TABLE \`tag\` ADD UNIQUE INDEX \`IDX_tag_ON_name\` (\`name\`)`);
        await queryRunner.query(`ALTER TABLE \`transfer_item\` CHANGE \`unit_price\` \`unit_price\` decimal(12,2) NOT NULL DEFAULT '0.00'`);
        await queryRunner.query(`ALTER TABLE \`transfer_item\` CHANGE \`total_set_price\` \`total_set_price\` decimal(12,2) NOT NULL DEFAULT '0.00'`);
        await queryRunner.query(`ALTER TABLE \`transfer_item\` CHANGE \`total_set_discount\` \`total_set_discount\` decimal(12,2) NOT NULL DEFAULT '0.00'`);
        await queryRunner.query(`ALTER TABLE \`transfer\` DROP FOREIGN KEY \`FK_transfer_target_account_id_REF_account_id\``);
        await queryRunner.query(`ALTER TABLE \`transfer\` DROP FOREIGN KEY \`FK_transfer_currency_symbol_REF_currency_symbol\``);
        await queryRunner.query(`ALTER TABLE \`transfer\` CHANGE \`type\` \`type\` enum ('INCOME', 'OUTCOME') NOT NULL DEFAULT 'OUTCOME'`);
        await queryRunner.query(`ALTER TABLE \`transfer\` CHANGE \`target_account_id\` \`target_account_id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`transfer\` CHANGE \`currency_symbol\` \`currency_symbol\` varchar(16) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`transfer\` ADD CONSTRAINT \`FK_transfer_currency_symbol_REF_currency_symbol\` FOREIGN KEY (\`currency_symbol\`) REFERENCES \`currency\`(\`symbol\`) ON DELETE RESTRICT ON UPDATE RESTRICT`);
        await queryRunner.query(`ALTER TABLE \`transfer\` ADD CONSTRAINT \`FK_transfer_target_account_id_REF_account_id\` FOREIGN KEY (\`target_account_id\`) REFERENCES \`account\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`item_tag\` ADD CONSTRAINT \`FK_item_tag_tag_id_REF_tag_id\` FOREIGN KEY (\`tag_id\`) REFERENCES \`tag\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`item_tag\` DROP FOREIGN KEY \`FK_item_tag_tag_id_REF_tag_id\``);
        await queryRunner.query(`ALTER TABLE \`transfer\` DROP FOREIGN KEY \`FK_transfer_target_account_id_REF_account_id\``);
        await queryRunner.query(`ALTER TABLE \`transfer\` DROP FOREIGN KEY \`FK_transfer_currency_symbol_REF_currency_symbol\``);
        await queryRunner.query(`ALTER TABLE \`transfer\` CHANGE \`currency_symbol\` \`currency_symbol\` varchar(16) NOT NULL DEFAULT 'PLN'`);
        await queryRunner.query(`ALTER TABLE \`transfer\` CHANGE \`target_account_id\` \`target_account_id\` int NOT NULL DEFAULT '17'`);
        await queryRunner.query(`ALTER TABLE \`transfer\` CHANGE \`type\` \`type\` enum ('INCOME', 'OUTCOME', 'INTERNAL') NOT NULL DEFAULT 'OUTCOME'`);
        await queryRunner.query(`ALTER TABLE \`transfer\` ADD CONSTRAINT \`FK_transfer_currency_symbol_REF_currency_symbol\` FOREIGN KEY (\`currency_symbol\`) REFERENCES \`currency\`(\`symbol\`) ON DELETE RESTRICT ON UPDATE RESTRICT`);
        await queryRunner.query(`ALTER TABLE \`transfer\` ADD CONSTRAINT \`FK_transfer_target_account_id_REF_account_id\` FOREIGN KEY (\`target_account_id\`) REFERENCES \`account\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`transfer_item\` CHANGE \`total_set_discount\` \`total_set_discount\` decimal(12,4) UNSIGNED NOT NULL DEFAULT '0.0000'`);
        await queryRunner.query(`ALTER TABLE \`transfer_item\` CHANGE \`total_set_price\` \`total_set_price\` decimal(12,4) UNSIGNED NOT NULL DEFAULT '0.0000'`);
        await queryRunner.query(`ALTER TABLE \`transfer_item\` CHANGE \`unit_price\` \`unit_price\` decimal(12,4) UNSIGNED NOT NULL DEFAULT '0.0000'`);
        await queryRunner.query(`ALTER TABLE \`tag\` DROP INDEX \`IDX_tag_ON_name\``);
        await queryRunner.query(`CREATE UNIQUE INDEX \`UQ_tag_name\` ON \`tag\` (\`name\`)`);
        await queryRunner.query(`ALTER TABLE \`item_tag\` ADD CONSTRAINT \`FK_item_tag_tag_id_REF_tag_id\` FOREIGN KEY (\`tag_id\`) REFERENCES \`tag\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

}
