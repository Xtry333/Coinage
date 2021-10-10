import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitAccountTable1633907815890 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "CREATE TABLE `account` (\
                `id` INT(10) NOT NULL AUTO_INCREMENT,\
                `name` VARCHAR(50) NOT NULL DEFAULT '0' COLLATE 'utf8mb4_0900_ai_ci',\
                `user_id` INT(10) NOT NULL,\
                PRIMARY KEY (`id`) USING BTREE,\
                INDEX `FK_account_user` (`user_id`) USING BTREE,\
                CONSTRAINT `FK_account_user` FOREIGN KEY (`user_id`) REFERENCES `coinage-db`.`user` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT\
            ) COLLATE='utf8mb4_0900_ai_ci' ENGINE=InnoDB;"
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('account');
    }
}
