import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSchedule1708475125634 implements MigrationInterface {
    public name = 'AddSchedule1708475125634';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE \`schedule\` (\`edited_date\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`created_date\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`id\` int NOT NULL AUTO_INCREMENT, \`name\` text NOT NULL, \`recurrence\` enum ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM') NOT NULL DEFAULT 'MONTHLY', \`metadata\` json NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(`ALTER TABLE \`transfer\` ADD \`schedule_id\` int NULL`);
        await queryRunner.query(
            `ALTER TABLE \`transfer\` ADD CONSTRAINT \`FK_transfer_schedule_id_REF_schedule_id\` FOREIGN KEY (\`schedule_id\`) REFERENCES \`schedule\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transfer\` DROP FOREIGN KEY \`FK_transfer_schedule_id_REF_schedule_id\``);
        await queryRunner.query(`ALTER TABLE \`transfer\` DROP COLUMN \`schedule_id\``);
        await queryRunner.query(`DROP TABLE \`schedule\``);
    }
}
