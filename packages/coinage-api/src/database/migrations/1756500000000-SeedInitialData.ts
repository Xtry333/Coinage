import * as crypto from 'crypto';
import { MigrationInterface, QueryRunner } from 'typeorm';

import { AuthService } from '../../app/auth/auth.service';

export class SeedInitialData1756500000000 implements MigrationInterface {
    public name = 'SeedInitialData1756500000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const users = await queryRunner.query(`SELECT id FROM \`user\` LIMIT 1`);
        if (users.length === 0) {
            const plainPassword = crypto.randomBytes(12).toString('base64url');
            const hashedPassword = await AuthService.hashPassword(plainPassword);
            await queryRunner.query(`
                INSERT INTO \`user\` (\`name\`, \`password\`, \`is_system_user\`, \`created_date\`)
                VALUES ('admin', ?, b'0', NOW())
            `, [hashedPassword]);
            console.log('');
            console.log('========================================================');
            console.log('  Default admin account created.');
            console.log(`  Username : admin`);
            console.log(`  Password : ${plainPassword}`);
            console.log('  Change this password after first login.');
            console.log('========================================================');
            console.log('');
        }

        const categories = await queryRunner.query(`SELECT id FROM \`category\` LIMIT 1`);
        if (categories.length === 0) {
            await queryRunner.query(`
                INSERT INTO \`category\` (\`name\`, \`type\`, \`description\`, \`tag\`) VALUES
                ('Housing & Utilities', 'OUTCOME', 'Rent, mortgage, electricity, water, internet, phone bills', 'housing'),
                ('Food & Groceries', 'OUTCOME', 'Supermarket shopping, grocery stores', 'groceries'),
                ('Dining Out', 'OUTCOME', 'Restaurants, cafes, takeaway, food delivery', 'dining'),
                ('Transportation', 'OUTCOME', 'Fuel, public transport, car maintenance, parking', 'transport'),
                ('Healthcare', 'OUTCOME', 'Doctor visits, medications, dental, insurance', 'healthcare'),
                ('Personal Care', 'OUTCOME', 'Haircuts, cosmetics, hygiene products', 'personal_care'),
                ('Entertainment', 'OUTCOME', 'Cinema, concerts, hobbies, games', 'entertainment'),
                ('Shopping', 'OUTCOME', 'Clothing, electronics, household items', 'shopping'),
                ('Education', 'OUTCOME', 'Courses, books, training, school fees', 'education'),
                ('Travel', 'OUTCOME', 'Flights, hotels, vacation expenses', 'travel'),
                ('Subscriptions', 'OUTCOME', 'Streaming services, software, memberships', 'subscriptions'),
                ('Gifts & Donations', 'OUTCOME', 'Presents, charity, donations', 'gifts'),
                ('Savings & Investments', 'OUTCOME', 'Transfers to savings, investment contributions', 'savings'),
                ('Other Expenses', 'OUTCOME', 'Miscellaneous expenses that do not fit other categories', 'other_expense'),
                ('Salary', 'INCOME', 'Regular employment income, wages', 'salary'),
                ('Freelance', 'INCOME', 'Freelance work, consulting, contract income', 'freelance'),
                ('Business Income', 'INCOME', 'Revenue from business activities', 'business'),
                ('Investment Returns', 'INCOME', 'Dividends, interest, capital gains', 'investment'),
                ('Other Income', 'INCOME', 'Miscellaneous income that does not fit other categories', 'other_income')
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM \`category\` WHERE \`tag\` IN (
            'housing', 'groceries', 'dining', 'transport', 'healthcare', 'personal_care',
            'entertainment', 'shopping', 'education', 'travel', 'subscriptions',
            'gifts', 'savings', 'other_expense', 'salary', 'freelance', 'business',
            'investment', 'other_income'
        )`);
        await queryRunner.query(`DELETE FROM \`user\` WHERE \`name\` = 'admin' AND \`is_system_user\` = b'0'`);
    }
}
