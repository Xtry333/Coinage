import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTables1000000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const sql =
            "\
            CREATE TABLE `user` (\
                `id` INT NOT NULL AUTO_INCREMENT,\
                `name` VARCHAR(64) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',\
                PRIMARY KEY (`id`) USING BTREE\
            ) COLLATE='utf8mb4_0900_ai_ci' ENGINE=InnoDB;\
            \
            CREATE TABLE `account` (\
                `id` INT NOT NULL AUTO_INCREMENT,\
                `name` VARCHAR(50) NOT NULL DEFAULT '0' COLLATE 'utf8mb4_0900_ai_ci',\
                `user_id` INT NOT NULL,\
                `is_active` BIT(1) NOT NULL DEFAULT b'1',\
                `edited_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\
                `created_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,\
                PRIMARY KEY (`id`) USING BTREE,\
                INDEX `FK_account_user` (`user_id`) USING BTREE,\
                CONSTRAINT `FK_account_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT\
            ) COLLATE='utf8mb4_0900_ai_ci' ENGINE=InnoDB;\
            \
            CREATE TABLE `group` (\
                `id` INT NOT NULL AUTO_INCREMENT,\
                `name` VARCHAR(64) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',\
                PRIMARY KEY (`id`) USING BTREE\
            ) COLLATE='utf8mb4_0900_ai_ci' ENGINE=InnoDB;\
            \
            CREATE TABLE `user_group` (\
                `id` INT NOT NULL AUTO_INCREMENT,\
                `user_id` INT NOT NULL,\
                `group_id` INT NOT NULL,\
                PRIMARY KEY (`id`) USING BTREE,\
                INDEX `FK_user_group_user` (`user_id`) USING BTREE,\
                INDEX `FK_user_group_group` (`group_id`) USING BTREE,\
                CONSTRAINT `FK_user_group_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,\
                CONSTRAINT `FK_user_group_group` FOREIGN KEY (`group_id`) REFERENCES `group` (`id`) ON UPDATE CASCADE ON DELETE CASCADE\
            ) COLLATE='utf8mb4_0900_ai_ci' ENGINE=InnoDB;\
            \
            CREATE TABLE `category` (\
                `id` INT NOT NULL AUTO_INCREMENT,\
                `name` VARCHAR(64) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',\
                `description` TEXT NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',\
                `parent_id` INT NULL DEFAULT NULL,\
                `user_id` INT NULL DEFAULT NULL,\
                `type` ENUM('INCOME','OUTCOME') NOT NULL DEFAULT 'OUTCOME' COLLATE 'utf8mb4_0900_ai_ci',\
                `tag` VARCHAR(64) NULL DEFAULT NULL,\
                PRIMARY KEY (`id`) USING BTREE,\
                UNIQUE INDEX `name` (`name`, `user_id`) USING BTREE,\
                UNIQUE INDEX `tag` (`tag`) USING BTREE,\
                INDEX `FK_category_category` (`parent_id`) USING BTREE,\
                INDEX `FK_account_user` (`user_id`) USING BTREE,\
                CONSTRAINT `FK_category_category` FOREIGN KEY (`parent_id`) REFERENCES `category` (`id`) ON UPDATE CASCADE ON DELETE SET NULL\
                CONSTRAINT `FK_account_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT\
            ) COLLATE='utf8mb4_0900_ai_ci' ENGINE=InnoDB;\
            \
            CREATE TABLE `contractor` (\
                `id` INT NOT NULL AUTO_INCREMENT,\
                `name` VARCHAR(64) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',\
                PRIMARY KEY (`id`) USING BTREE\
            ) COLLATE='utf8mb4_0900_ai_ci' ENGINE=InnoDB;\
            \
            CREATE TABLE `receipt` (\
                `id` INT NOT NULL AUTO_INCREMENT,\
                `description` TEXT NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',\
                `date` DATE NOT NULL DEFAULT (now()),\
                `amount` DECIMAL(20,2) NOT NULL DEFAULT '0.00',\
                `contractor_id` INT NULL DEFAULT NULL,\
                PRIMARY KEY (`id`) USING BTREE,\
                INDEX `FK_receipt_contractor` (`contractor_id`) USING BTREE,\
                CONSTRAINT `FK_receipt_contractor` FOREIGN KEY (`contractor_id`) REFERENCES `contractor` (`id`) ON UPDATE CASCADE ON DELETE SET NULL\
            ) COLLATE='utf8mb4_0900_ai_ci' ENGINE=InnoDB;\
            \
            CREATE TABLE `transfer` (\
                `id` INT NOT NULL AUTO_INCREMENT,\
                `description` TEXT NOT NULL COLLATE 'utf8mb4_0900_ai_ci',\
                `amount` DECIMAL(20,2) NOT NULL DEFAULT '0.00',\
                `account_id` INT NOT NULL,\
                `category_id` INT NOT NULL,\
                `contractor_id` INT NULL DEFAULT NULL,\
                `type` ENUM('INCOME','OUTCOME') NOT NULL DEFAULT 'OUTCOME' COLLATE 'utf8mb4_0900_ai_ci',\
                `date` DATE NOT NULL DEFAULT (now()),\
                `receipt_id` INT NULL DEFAULT NULL,\
                `is_internal` BIT(1) NOT NULL DEFAULT b'0',\
                `is_ethereal` BIT(1) NOT NULL DEFAULT b'0',\
                `edited_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\
                `created_date` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,\
                `metadata` JSON NOT NULL DEFAULT (json_object()),\
                PRIMARY KEY (`id`) USING BTREE,\
                INDEX `FK_transfer_receipt` (`receipt_id`) USING BTREE,\
                INDEX `FK_transfer_contractor` (`contractor_id`) USING BTREE,\
                INDEX `FK_transfer_category` (`category_id`) USING BTREE,\
                INDEX `FK_transfer_account` (`account_id`) USING BTREE,\
                CONSTRAINT `FK_transfer_account` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,\
                CONSTRAINT `FK_transfer_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,\
                CONSTRAINT `FK_transfer_contractor` FOREIGN KEY (`contractor_id`) REFERENCES `contractor` (`id`) ON UPDATE CASCADE ON DELETE SET NULL,\
                CONSTRAINT `FK_transfer_receipt` FOREIGN KEY (`receipt_id`) REFERENCES `receipt` (`id`) ON UPDATE CASCADE ON DELETE SET NULL\
            ) COLLATE='utf8mb4_0900_ai_ci' ENGINE=InnoDB;\
            \
            CREATE TABLE `item` (\
                `id` INT NOT NULL AUTO_INCREMENT,\
                `name` TEXT NOT NULL COLLATE 'utf8mb4_0900_ai_ci',\
                `edited_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\
                `created_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,\
                PRIMARY KEY (`id`) USING BTREE\
            ) COLLATE='utf8mb4_0900_ai_ci' ENGINE=InnoDB;\
            \
            CREATE TABLE `transfer_item` (\
                `id` INT NOT NULL AUTO_INCREMENT,\
                `item_id` INT NOT NULL,\
                `unit_price` DECIMAL(20,2) NOT NULL DEFAULT '0.00',\
                `units` FLOAT NOT NULL DEFAULT 1,\
                `transfer_id` INT NOT NULL,\
                PRIMARY KEY (`id`) USING BTREE,\
                INDEX `FK_transfer_item_transfer` (`transfer_id`) USING BTREE,\
                INDEX `FK_transfer_item_item` (`item_id`) USING BTREE,\
                CONSTRAINT `FK_transfer_item_transfer` FOREIGN KEY (`transfer_id`) REFERENCES `transfer` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,\
                CONSTRAINT `FK_transfer_item_item` FOREIGN KEY (`item_id`) REFERENCES `item` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT\
            ) COLLATE='utf8mb4_0900_ai_ci' ENGINE=InnoDB;\
            ";
        sql.split(/;/).forEach(async (query) => {
            query = query.trim();
            if (query.length > 0) {
                await queryRunner.query(query);
            }
        });
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('');
    }
}
