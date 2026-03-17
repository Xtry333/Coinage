import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTables1000000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`user\` (
                \`id\` INT NOT NULL AUTO_INCREMENT,
                \`name\` VARCHAR(64) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
                \`is_system_user\` BIT(1) NOT NULL DEFAULT b'0',
                \`created_date\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`) USING BTREE
            ) COLLATE='utf8mb4_0900_ai_ci' ENGINE=InnoDB
        `);

        await queryRunner.query(`
            CREATE TABLE \`account\` (
                \`id\` INT NOT NULL AUTO_INCREMENT,
                \`name\` VARCHAR(50) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
                \`user_id\` INT NOT NULL,
                \`currency_symbol\` VARCHAR(16) NULL DEFAULT NULL,
                \`is_contractor_account\` BIT(1) NOT NULL DEFAULT b'0',
                \`is_active\` BIT(1) NOT NULL DEFAULT b'1',
                \`edited_date\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`created_date\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`) USING BTREE,
                INDEX \`FK_account_user\` (\`user_id\`) USING BTREE
            ) COLLATE='utf8mb4_0900_ai_ci' ENGINE=InnoDB
        `);

        await queryRunner.query(`
            CREATE TABLE \`group\` (
                \`id\` INT NOT NULL AUTO_INCREMENT,
                \`name\` VARCHAR(64) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
                PRIMARY KEY (\`id\`) USING BTREE
            ) COLLATE='utf8mb4_0900_ai_ci' ENGINE=InnoDB
        `);

        await queryRunner.query(`
            CREATE TABLE \`user_group\` (
                \`id\` INT NOT NULL AUTO_INCREMENT,
                \`user_id\` INT NOT NULL,
                \`group_id\` INT NOT NULL,
                PRIMARY KEY (\`id\`) USING BTREE,
                INDEX \`FK_user_group_user\` (\`user_id\`) USING BTREE,
                INDEX \`FK_user_group_group\` (\`group_id\`) USING BTREE,
                CONSTRAINT \`FK_user_group_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\` (\`id\`) ON UPDATE CASCADE ON DELETE CASCADE,
                CONSTRAINT \`FK_user_group_group\` FOREIGN KEY (\`group_id\`) REFERENCES \`group\` (\`id\`) ON UPDATE CASCADE ON DELETE CASCADE
            ) COLLATE='utf8mb4_0900_ai_ci' ENGINE=InnoDB
        `);

        await queryRunner.query(`
            CREATE TABLE \`category\` (
                \`id\` INT NOT NULL AUTO_INCREMENT,
                \`name\` VARCHAR(64) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
                \`description\` TEXT NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
                \`parent_id\` INT NULL DEFAULT NULL,
                \`user_id\` INT NULL DEFAULT NULL,
                \`type\` ENUM('INCOME','OUTCOME') NOT NULL DEFAULT 'OUTCOME' COLLATE 'utf8mb4_0900_ai_ci',
                \`tag\` VARCHAR(64) NULL DEFAULT NULL,
                PRIMARY KEY (\`id\`) USING BTREE,
                UNIQUE INDEX \`name\` (\`name\`, \`user_id\`) USING BTREE,
                UNIQUE INDEX \`tag\` (\`tag\`) USING BTREE,
                INDEX \`FK_category_category\` (\`parent_id\`) USING BTREE,
                INDEX \`FK_category_user\` (\`user_id\`) USING BTREE
            ) COLLATE='utf8mb4_0900_ai_ci' ENGINE=InnoDB
        `);

        await queryRunner.query(`
            CREATE TABLE \`contractor\` (
                \`id\` INT NOT NULL AUTO_INCREMENT,
                \`name\` VARCHAR(64) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
                \`is_active\` BIT(1) NOT NULL DEFAULT b'1',
                PRIMARY KEY (\`id\`) USING BTREE
            ) COLLATE='utf8mb4_0900_ai_ci' ENGINE=InnoDB
        `);

        await queryRunner.query(`
            CREATE TABLE \`receipt\` (
                \`id\` INT NOT NULL AUTO_INCREMENT,
                \`description\` TEXT NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
                \`date\` DATE NOT NULL DEFAULT (now()),
                \`amount\` DECIMAL(20,2) NOT NULL DEFAULT '0.00',
                \`contractor_id\` INT NULL DEFAULT NULL,
                PRIMARY KEY (\`id\`) USING BTREE,
                INDEX \`FK_receipt_contractor\` (\`contractor_id\`) USING BTREE
            ) COLLATE='utf8mb4_0900_ai_ci' ENGINE=InnoDB
        `);

        await queryRunner.query(`
            CREATE TABLE \`transfer\` (
                \`id\` INT NOT NULL AUTO_INCREMENT,
                \`description\` TEXT NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
                \`amount\` DECIMAL(20,2) NOT NULL DEFAULT '0.00',
                \`account_id\` INT NOT NULL,
                \`target_account_id\` INT NULL DEFAULT NULL,
                \`category_id\` INT NOT NULL,
                \`contractor_id\` INT NULL DEFAULT NULL,
                \`owner_user_id\` INT NULL DEFAULT NULL,
                \`type\` ENUM('INCOME','OUTCOME') NOT NULL DEFAULT 'OUTCOME' COLLATE 'utf8mb4_0900_ai_ci',
                \`date\` DATE NOT NULL DEFAULT (now()),
                \`accounting_date\` DATE NULL DEFAULT NULL,
                \`receipt_id\` INT NULL DEFAULT NULL,
                \`is_ethereal\` BIT(1) NOT NULL DEFAULT b'0',
                \`is_flagged\` BIT(1) NOT NULL DEFAULT b'0',
                \`edited_date\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`created_date\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                \`metadata\` JSON NOT NULL DEFAULT (json_object()),
                PRIMARY KEY (\`id\`) USING BTREE,
                INDEX \`FK_transfer_receipt\` (\`receipt_id\`) USING BTREE,
                INDEX \`FK_transfer_contractor\` (\`contractor_id\`) USING BTREE,
                INDEX \`FK_transfer_category\` (\`category_id\`) USING BTREE,
                INDEX \`FK_transfer_account\` (\`account_id\`) USING BTREE,
                INDEX \`FK_transfer_target_account\` (\`target_account_id\`) USING BTREE,
                INDEX \`FK_transfer_owner_user\` (\`owner_user_id\`) USING BTREE
            ) COLLATE='utf8mb4_0900_ai_ci' ENGINE=InnoDB
        `);

        await queryRunner.query(`
            CREATE TABLE \`item\` (
                \`id\` INT NOT NULL AUTO_INCREMENT,
                \`brand\` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
                \`name\` VARCHAR(50) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
                \`category_id\` INT NULL DEFAULT NULL,
                \`container_size\` FLOAT NULL DEFAULT NULL,
                \`container_size_unit\` VARCHAR(16) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
                \`edited_date\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`created_date\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`) USING BTREE,
                INDEX \`FK_item_category\` (\`category_id\`) USING BTREE
            ) COLLATE='utf8mb4_0900_ai_ci' ENGINE=InnoDB
        `);

        await queryRunner.query(`
            CREATE TABLE \`transfer_item\` (
                \`id\` INT NOT NULL AUTO_INCREMENT,
                \`item_id\` INT NOT NULL,
                \`unit_price\` DECIMAL(12,2) NOT NULL DEFAULT '0.00',
                \`total_set_price\` DECIMAL(12,2) NOT NULL DEFAULT '0.00',
                \`total_set_discount\` DECIMAL(12,2) NOT NULL DEFAULT '0.00',
                \`quantity\` FLOAT NOT NULL DEFAULT 1,
                \`transfer_id\` INT NOT NULL,
                PRIMARY KEY (\`id\`) USING BTREE,
                INDEX \`FK_transfer_item_transfer\` (\`transfer_id\`) USING BTREE,
                INDEX \`FK_transfer_item_item\` (\`item_id\`) USING BTREE
            ) COLLATE='utf8mb4_0900_ai_ci' ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS `transfer_item`');
        await queryRunner.query('DROP TABLE IF EXISTS `transfer`');
        await queryRunner.query('DROP TABLE IF EXISTS `item`');
        await queryRunner.query('DROP TABLE IF EXISTS `receipt`');
        await queryRunner.query('DROP TABLE IF EXISTS `contractor`');
        await queryRunner.query('DROP TABLE IF EXISTS `category`');
        await queryRunner.query('DROP TABLE IF EXISTS `user_group`');
        await queryRunner.query('DROP TABLE IF EXISTS `group`');
        await queryRunner.query('DROP TABLE IF EXISTS `account`');
        await queryRunner.query('DROP TABLE IF EXISTS `user`');
    }
}
