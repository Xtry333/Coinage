import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitContractorTable1633906124577 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "CREATE TABLE `contractor` (\
                `id` INT(10) NOT NULL AUTO_INCREMENT,\
                `name` VARCHAR(64) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',\
                PRIMARY KEY (`id`) USING BTREE\
            ) COLLATE='utf8mb4_0900_ai_ci' ENGINE=InnoDB;"
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE `contractor`');
    }
}
