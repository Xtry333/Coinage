import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetMetadataToDefaultEmpty1637152551502 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
                UPDATE \`transfer\`
                SET \`metadata\` = '{}' WHERE \`metadata\` IS NULL;
        `);
        await queryRunner.query(`
                ALTER TABLE \`transfer\`
                CHANGE COLUMN \`metadata\` \`metadata\` JSON NOT NULL DEFAULT (JSON_OBJECT());
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
                ALTER TABLE \`transfer\`
                CHANGE COLUMN \`metadata\` \`metadata\` JSON;
        `);
    }
}
