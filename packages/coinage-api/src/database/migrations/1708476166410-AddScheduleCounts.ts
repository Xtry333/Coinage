import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddScheduleCounts1708476166410 implements MigrationInterface {
    public name = 'AddScheduleCounts1708476166410';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`schedule\` ADD \`start_date\` timestamp NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`schedule\` ADD \`count\` int NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`schedule\` DROP COLUMN \`count\``);
        await queryRunner.query(`ALTER TABLE \`schedule\` DROP COLUMN \`start_date\``);
    }
}
