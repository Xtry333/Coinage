import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReceiptExtractedStatus1756500000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`receipt\` MODIFY COLUMN \`processing_status\` ENUM('NONE','PENDING','PROCESSING','EXTRACTED','PROCESSED','DUPLICATE','ERROR') NOT NULL DEFAULT 'NONE'`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE \`receipt\` SET \`processing_status\` = 'PENDING' WHERE \`processing_status\` = 'EXTRACTED'`);
        await queryRunner.query(
            `ALTER TABLE \`receipt\` MODIFY COLUMN \`processing_status\` ENUM('NONE','PENDING','PROCESSING','PROCESSED','DUPLICATE','ERROR') NOT NULL DEFAULT 'NONE'`,
        );
    }
}
