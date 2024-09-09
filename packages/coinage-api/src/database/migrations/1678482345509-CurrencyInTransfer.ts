import { MigrationInterface, QueryRunner } from 'typeorm';

export class CurrencyInTransfer1678482345509 implements MigrationInterface {
    public name = 'CurrencyInTransfer1678482345509';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transfer\` ADD \`currency_symbol\` varchar(16)`);
        await queryRunner.query(`UPDATE \`transfer\` SET \`currency_symbol\` = "PLN"`);
        await queryRunner.query(`ALTER TABLE \`transfer\` MODIFY \`currency_symbol\` varchar(16) NOT NULL`);
        await queryRunner.query(
            `ALTER TABLE \`transfer\` ADD CONSTRAINT \`FK_transfer_currency_symbol_REF_currency_symbol\` FOREIGN KEY (\`currency_symbol\`) REFERENCES \`currency\`(\`symbol\`) ON DELETE RESTRICT ON UPDATE RESTRICT`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transfer\` DROP FOREIGN KEY \`FK_transfer_currency_symbol_REF_currency_symbol\``);
        await queryRunner.query(`ALTER TABLE \`transfer\` DROP COLUMN \`currency_symbol\``);
    }
}
