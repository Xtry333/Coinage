import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitReceiptTable1633908144642 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "CREATE TABLE `receipt` (\
                `id` INT(10) NOT NULL AUTO_INCREMENT,\
                `description` TEXT NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',\
                `date` DATE NULL DEFAULT NULL,\
                `amount` DECIMAL(20,2) NOT NULL,\
                `contractor` INT(10) NULL DEFAULT NULL,\
                PRIMARY KEY (`id`) USING BTREE,\
                INDEX `FK_receipt_contractor` (`contractor`) USING BTREE,\
                CONSTRAINT `FK_receipt_contractor` FOREIGN KEY (`contractor`) REFERENCES `coinage-db`.`contractor` (`id`) ON UPDATE CASCADE ON DELETE SET NULL\
            ) COLLATE='utf8mb4_0900_ai_ci' ENGINE=InnoDB;"
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('receipt');
    }
}
