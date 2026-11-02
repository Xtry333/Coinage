import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminUserFromEnv1793491202000 implements MigrationInterface {
    public name = 'CreateAdminUserFromEnv1793491202000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const username = process.env.COINAGE_ADMIN_USERNAME?.trim();
        const password = process.env.COINAGE_ADMIN_PASSWORD;
        const existingUsers = (await queryRunner.query(`SELECT "id" FROM "user" LIMIT 1`)) as Array<{ id: number }>;

        if (!username && !password && existingUsers.length > 0) {
            return;
        }
        if (!username || !password) {
            throw new Error('Set COINAGE_ADMIN_USERNAME and COINAGE_ADMIN_PASSWORD in .env to bootstrap the first admin user.');
        }
        if (username.length > 50 || password.length > 64) {
            throw new Error('COINAGE_ADMIN_USERNAME must be at most 50 characters and COINAGE_ADMIN_PASSWORD at most 64 characters.');
        }

        const existingAdmin = (await queryRunner.query(`SELECT "id" FROM "user" WHERE "name" = $1 LIMIT 1`, [username])) as Array<{
            id: number;
        }>;
        if (existingAdmin.length > 0) {
            await queryRunner.query(`UPDATE "user" SET "is_system_user" = TRUE WHERE "id" = $1`, [existingAdmin[0].id]);
            return;
        }

        await queryRunner.query(`INSERT INTO "user" ("name", "password", "is_system_user") VALUES ($1, $2, TRUE)`, [username, password]);
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // The admin may have been used since bootstrap; don't delete the account on rollback.
    }
}
