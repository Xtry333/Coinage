import { MigrationInterface, QueryRunner } from 'typeorm';

export class SignedItemPrices1795776000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE item_kind (
                code VARCHAR(32) PRIMARY KEY,
                name VARCHAR(64) NOT NULL
            )
        `);
        await queryRunner.query(`
            INSERT INTO item_kind (code, name) VALUES
                ('PRODUCT', 'Product'), ('DEPOSIT', 'Deposit'), ('ADJUSTMENT', 'Adjustment / coupon')
        `);
        await queryRunner.query(`
            ALTER TABLE item
                ADD COLUMN kind_code VARCHAR(32) NOT NULL DEFAULT 'PRODUCT',
                ADD CONSTRAINT fk_item_kind FOREIGN KEY (kind_code) REFERENCES item_kind(code)
                    ON UPDATE CASCADE ON DELETE RESTRICT
        `);
        await queryRunner.query(`ALTER TABLE transfer RENAME COLUMN account_id TO origin_account_id`);
        // Existing negative transfers must be corrected explicitly, never by swapping accounts.
        await queryRunner.query(`
            ALTER TABLE transfer ADD CONSTRAINT ck_transfer_amount_nonnegative CHECK (amount >= 0)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE transfer DROP CONSTRAINT ck_transfer_amount_nonnegative`);
        await queryRunner.query(`ALTER TABLE transfer RENAME COLUMN origin_account_id TO account_id`);
        await queryRunner.query(`ALTER TABLE item DROP COLUMN kind_code`);
        await queryRunner.query(`DROP TABLE item_kind`);
    }
}
