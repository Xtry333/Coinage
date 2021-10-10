import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitTransferTable1633908272116 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "CREATE TABLE `transfer` (\
                `id` INT(10) NOT NULL AUTO_INCREMENT,\
                `description` TEXT NOT NULL COLLATE 'utf8mb4_0900_ai_ci',\
                `amount` DECIMAL(20,2) NOT NULL DEFAULT '0.00',\
                `category` INT(10) NOT NULL,\
                `contractor` INT(10) NULL DEFAULT NULL,\
                `type` ENUM('INCOME','OUTCOME') NOT NULL DEFAULT 'OUTCOME' COLLATE 'utf8mb4_0900_ai_ci',\
                `date` DATE NULL DEFAULT NULL,\
                `edited_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\
                `created_date` TIMESTAMP NULL DEFAULT NULL,\
                `receipt` INT(10) NULL DEFAULT NULL,\
                `account_id` INT(10) NULL DEFAULT NULL,\
                `metadata` JSON NULL DEFAULT NULL,\
                PRIMARY KEY (`id`) USING BTREE,\
                INDEX `FK_transfer_receipt` (`receipt`) USING BTREE,\
                INDEX `FK_transfer_contractor` (`contractor`) USING BTREE,\
                INDEX `FK_transfer_category` (`category`) USING BTREE,\
                INDEX `FK_transfer_account` (`account_id`) USING BTREE,\
                CONSTRAINT `FK_transfer_account` FOREIGN KEY (`account_id`) REFERENCES `coinage-db`.`account` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,\
                CONSTRAINT `FK_transfer_category` FOREIGN KEY (`category`) REFERENCES `coinage-db`.`category` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,\
                CONSTRAINT `FK_transfer_contractor` FOREIGN KEY (`contractor`) REFERENCES `coinage-db`.`contractor` (`id`) ON UPDATE CASCADE ON DELETE SET NULL,\
                CONSTRAINT `FK_transfer_receipt` FOREIGN KEY (`receipt`) REFERENCES `coinage-db`.`receipt` (`id`) ON UPDATE CASCADE ON DELETE SET NULL\
            ) COLLATE='utf8mb4_0900_ai_ci' ENGINE=InnoDB;"
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('transfer');
    }
}
