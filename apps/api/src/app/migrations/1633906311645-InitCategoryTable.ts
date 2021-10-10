import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitCategoryTable1633906311645 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "CREATE TABLE `category` (\
                `id` INT(10) NOT NULL AUTO_INCREMENT,\
                `name` VARCHAR(64) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',\
                `description` TEXT NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',\
                `parent` INT(10) NULL DEFAULT NULL,\
                `type` ENUM('INCOME','OUTCOME') NOT NULL DEFAULT 'OUTCOME' COLLATE 'utf8mb4_0900_ai_ci',\
                PRIMARY KEY (`id`) USING BTREE,\
                UNIQUE INDEX `name` (`name`) USING BTREE,\
                INDEX `FK_category_category` (`parent`) USING BTREE,\
                CONSTRAINT `FK_category_category` FOREIGN KEY (`parent`) REFERENCES `coinage-db`.`category` (`id`) ON UPDATE CASCADE ON DELETE SET NULL\
            ) COLLATE='utf8mb4_0900_ai_ci' ENGINE=InnoDB;"
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('category');
    }
}
