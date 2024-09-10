import { MigrationInterface, QueryRunner } from 'typeorm';

export class CurrencyTable1678465646320 implements MigrationInterface {
    public name = 'CurrencyTable1678465646320';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE \`currency\` (\`symbol\` varchar(16) NOT NULL, \`name\` varchar(50) NOT NULL, \`shorthand\` varchar(16) NOT NULL, PRIMARY KEY (\`symbol\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(`INSERT INTO \`currency\` VALUES ("PLN", "Polish złoty", "% zł"), ("GBP", "Pound sterling", "£%")`);
        await queryRunner.query(`ALTER TABLE \`account\` MODIFY \`currency_symbol\` varchar(16) NOT NULL;`);
        await queryRunner.query(
            `ALTER TABLE \`account\` ADD CONSTRAINT \`FK_account_currency_symbol_REF_currency_symbol\` FOREIGN KEY (\`currency_symbol\`) REFERENCES \`currency\`(\`symbol\`) ON DELETE RESTRICT ON UPDATE RESTRICT;`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`currency\``);
    }
}
