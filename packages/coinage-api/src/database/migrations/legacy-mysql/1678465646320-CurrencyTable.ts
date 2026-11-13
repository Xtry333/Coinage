import { MigrationInterface, QueryRunner } from 'typeorm';

export class CurrencyTable1678465646320 implements MigrationInterface {
    public name = 'CurrencyTable1678465646320';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS \`currency\` (\`symbol\` varchar(16) NOT NULL, \`name\` varchar(50) NOT NULL, \`shorthand\` varchar(16) NOT NULL, PRIMARY KEY (\`symbol\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(`INSERT IGNORE INTO \`currency\` VALUES ("PLN", "Polish złoty", "% zł"), ("GBP", "Pound sterling", "£%")`);
        if (!(await queryRunner.hasColumn('account', 'currency_symbol'))) {
            await queryRunner.query(`ALTER TABLE \`account\` ADD \`currency_symbol\` varchar(16) NULL`);
        }
        await queryRunner.query(`UPDATE \`account\` SET \`currency_symbol\` = "PLN" WHERE \`currency_symbol\` IS NULL`);
        await queryRunner.query(`ALTER TABLE \`account\` MODIFY \`currency_symbol\` varchar(16) NOT NULL;`);
        const accountTable = await queryRunner.getTable('account');
        if (!accountTable?.foreignKeys.some((foreignKey) => foreignKey.name === 'FK_account_currency_symbol_REF_currency_symbol')) {
            await queryRunner.query(
                `ALTER TABLE \`account\` ADD CONSTRAINT \`FK_account_currency_symbol_REF_currency_symbol\` FOREIGN KEY (\`currency_symbol\`) REFERENCES \`currency\`(\`symbol\`) ON DELETE RESTRICT ON UPDATE RESTRICT;`,
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`currency\``);
    }
}
