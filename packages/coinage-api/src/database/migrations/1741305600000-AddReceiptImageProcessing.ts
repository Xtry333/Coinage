import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReceiptImageProcessing1741305600000 implements MigrationInterface {
    name = 'AddReceiptImageProcessing1741305600000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`receipt\`
            ADD COLUMN \`image_path\` varchar(500) NULL DEFAULT NULL,
            ADD COLUMN \`image_hash\` varchar(64) NULL DEFAULT NULL,
            ADD COLUMN \`processing_status\` enum('NONE','PENDING','PROCESSING','PROCESSED','DUPLICATE','ERROR') NOT NULL DEFAULT 'NONE',
            ADD COLUMN \`ai_extracted_data\` json NULL DEFAULT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`receipt\`
            DROP COLUMN \`ai_extracted_data\`,
            DROP COLUMN \`processing_status\`,
            DROP COLUMN \`image_hash\`,
            DROP COLUMN \`image_path\`
        `);
    }
}
