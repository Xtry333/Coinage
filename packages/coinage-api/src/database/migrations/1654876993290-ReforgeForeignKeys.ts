import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReforgeForeignKeys1654876993290 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`FK_category_category\` ON \`category\``);
        await queryRunner.query(`DROP INDEX \`FK_category_user\` ON \`category\``);
        await queryRunner.query(`DROP INDEX \`FK_transfer_item_item\` ON \`transfer_item\``);
        await queryRunner.query(`DROP INDEX \`FK_transfer_item_transfer\` ON \`transfer_item\``);
        await queryRunner.query(`DROP INDEX \`FK_transfer_account\` ON \`transfer\``);
        await queryRunner.query(`DROP INDEX \`FK_transfer_category\` ON \`transfer\``);
        await queryRunner.query(`DROP INDEX \`FK_transfer_contractor\` ON \`transfer\``);
        await queryRunner.query(`DROP INDEX \`FK_transfer_receipt\` ON \`transfer\``);
        await queryRunner.query(`DROP INDEX \`FK_receipt_contractor\` ON \`receipt\``);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_account_ON_name_user_id\` ON \`account\` (\`name\`, \`user_id\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_category_ON_tag\` ON \`category\` (\`tag\`)`);
        await queryRunner.query(
            `ALTER TABLE \`account\` ADD CONSTRAINT \`FK_account_user_id_REF_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT`
        );
        await queryRunner.query(
            `ALTER TABLE \`category\` ADD CONSTRAINT \`FK_category_parent_id_REF_category_id\` FOREIGN KEY (\`parent_id\`) REFERENCES \`category\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`
        );
        await queryRunner.query(
            `ALTER TABLE \`category\` ADD CONSTRAINT \`FK_category_user_id_REF_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE`
        );
        await queryRunner.query(
            `ALTER TABLE \`transfer_item\` ADD CONSTRAINT \`FK_transfer_item_transfer_id_REF_transfer_id\` FOREIGN KEY (\`transfer_id\`) REFERENCES \`transfer\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
        );
        await queryRunner.query(
            `ALTER TABLE \`transfer_item\` ADD CONSTRAINT \`FK_transfer_item_item_id_REF_item_id\` FOREIGN KEY (\`item_id\`) REFERENCES \`item\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE`
        );
        await queryRunner.query(
            `ALTER TABLE \`transfer\` ADD CONSTRAINT \`FK_transfer_category_id_REF_category_id\` FOREIGN KEY (\`category_id\`) REFERENCES \`category\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE`
        );
        await queryRunner.query(
            `ALTER TABLE \`transfer\` ADD CONSTRAINT \`FK_transfer_contractor_id_REF_contractor_id\` FOREIGN KEY (\`contractor_id\`) REFERENCES \`contractor\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`
        );
        await queryRunner.query(
            `ALTER TABLE \`transfer\` ADD CONSTRAINT \`FK_transfer_receipt_id_REF_receipt_id\` FOREIGN KEY (\`receipt_id\`) REFERENCES \`receipt\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`
        );
        await queryRunner.query(
            `ALTER TABLE \`transfer\` ADD CONSTRAINT \`FK_transfer_account_id_REF_account_id\` FOREIGN KEY (\`account_id\`) REFERENCES \`account\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE`
        );
        await queryRunner.query(
            `ALTER TABLE \`receipt\` ADD CONSTRAINT \`FK_receipt_contractor_id_REF_contractor_id\` FOREIGN KEY (\`contractor_id\`) REFERENCES \`contractor\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`receipt\` DROP FOREIGN KEY \`FK_receipt_contractor_id_REF_contractor_id\``);
        await queryRunner.query(`ALTER TABLE \`transfer\` DROP FOREIGN KEY \`FK_transfer_account_id_REF_account_id\``);
        await queryRunner.query(`ALTER TABLE \`transfer\` DROP FOREIGN KEY \`FK_transfer_receipt_id_REF_receipt_id\``);
        await queryRunner.query(`ALTER TABLE \`transfer\` DROP FOREIGN KEY \`FK_transfer_contractor_id_REF_contractor_id\``);
        await queryRunner.query(`ALTER TABLE \`transfer\` DROP FOREIGN KEY \`FK_transfer_category_id_REF_category_id\``);
        await queryRunner.query(`ALTER TABLE \`transfer_item\` DROP FOREIGN KEY \`FK_transfer_item_item_id_REF_item_id\``);
        await queryRunner.query(`ALTER TABLE \`transfer_item\` DROP FOREIGN KEY \`FK_transfer_item_transfer_id_REF_transfer_id\``);
        await queryRunner.query(`ALTER TABLE \`category\` DROP FOREIGN KEY \`FK_category_user_id_REF_user_id\``);
        await queryRunner.query(`ALTER TABLE \`category\` DROP FOREIGN KEY \`FK_category_parent_id_REF_category_id\``);
        await queryRunner.query(`ALTER TABLE \`account\` DROP FOREIGN KEY \`FK_account_user_id_REF_user_id\``);
        await queryRunner.query(`DROP INDEX \`IDX_category_ON_tag\` ON \`category\``);
        await queryRunner.query(`DROP INDEX \`IDX_account_ON_name_user_id\` ON \`account\``);
        await queryRunner.query(`CREATE INDEX \`FK_receipt_contractor\` ON \`receipt\` (\`contractor_id\`)`);
        await queryRunner.query(`CREATE INDEX \`FK_transfer_receipt\` ON \`transfer\` (\`receipt_id\`)`);
        await queryRunner.query(`CREATE INDEX \`FK_transfer_contractor\` ON \`transfer\` (\`contractor_id\`)`);
        await queryRunner.query(`CREATE INDEX \`FK_transfer_category\` ON \`transfer\` (\`category_id\`)`);
        await queryRunner.query(`CREATE INDEX \`FK_transfer_account\` ON \`transfer\` (\`account_id\`)`);
        await queryRunner.query(`CREATE INDEX \`FK_transfer_item_transfer\` ON \`transfer_item\` (\`transfer_id\`)`);
        await queryRunner.query(`CREATE INDEX \`FK_transfer_item_item\` ON \`transfer_item\` (\`item_id\`)`);
        await queryRunner.query(`CREATE INDEX \`FK_category_user\` ON \`category\` (\`user_id\`)`);
        await queryRunner.query(`CREATE INDEX \`FK_category_category\` ON \`category\` (\`parent_id\`)`);
    }
}
