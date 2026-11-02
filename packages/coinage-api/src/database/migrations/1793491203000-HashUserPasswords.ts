import { MigrationInterface, QueryRunner } from 'typeorm';

import { hashPassword, isPasswordHash } from '../../app/auth/password-hash.util';

export class HashUserPasswords1793491203000 implements MigrationInterface {
    public name = 'HashUserPasswords1793491203000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` MODIFY \`password\` varchar(255) NULL`);
        const users = (await queryRunner.query(`SELECT \`id\`, \`password\` FROM \`user\` WHERE \`password\` IS NOT NULL`)) as Array<{
            id: number;
            password: string;
        }>;

        for (const user of users) {
            if (!isPasswordHash(user.password)) {
                await queryRunner.query(`UPDATE \`user\` SET \`password\` = ? WHERE \`id\` = ?`, [hashPassword(user.password), user.id]);
            }
        }
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // Password hashes cannot be reverted to their original plain-text values.
    }
}
