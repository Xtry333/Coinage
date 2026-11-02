import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1793621686531 implements MigrationInterface {
    public name = 'Migration1793621686531';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "item_tag" DROP CONSTRAINT IF EXISTS fk_item_tag_tag_id_ref_tag_id`);
        await queryRunner.query(`ALTER TABLE "tag" DROP CONSTRAINT IF EXISTS tag_name_key`);
        await queryRunner.query(`ALTER TABLE "tag" DROP CONSTRAINT IF EXISTS uq_tag_name`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_tag_on_name`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_tag_on_name ON "tag" ("name")`);

        await queryRunner.query(`ALTER TABLE "transfer_item" ALTER COLUMN "unit_price" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "transfer_item" ALTER COLUMN "total_set_price" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "transfer_item" ALTER COLUMN "total_set_discount" TYPE numeric(12,2)`);

        await queryRunner.query(`ALTER TABLE "transfer" DROP CONSTRAINT IF EXISTS fk_transfer_target_account_id_ref_account_id`);
        await queryRunner.query(`ALTER TABLE "transfer" DROP CONSTRAINT IF EXISTS fk_transfer_currency_symbol_ref_currency_symbol`);
        await queryRunner.query(`ALTER TABLE "transfer" ALTER COLUMN "target_account_id" TYPE integer USING "target_account_id"::integer`);
        await queryRunner.query(`ALTER TABLE "transfer" ALTER COLUMN "target_account_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "transfer" ALTER COLUMN "currency_symbol" TYPE varchar(16) USING "currency_symbol"::varchar(16)`);
        await queryRunner.query(`ALTER TABLE "transfer" ALTER COLUMN "currency_symbol" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "transfer" ADD CONSTRAINT fk_transfer_currency_symbol_ref_currency_symbol FOREIGN KEY ("currency_symbol") REFERENCES currency("symbol") ON DELETE RESTRICT ON UPDATE RESTRICT`);
        await queryRunner.query(`ALTER TABLE "transfer" ADD CONSTRAINT fk_transfer_target_account_id_ref_account_id FOREIGN KEY ("target_account_id") REFERENCES account("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "item_tag" ADD CONSTRAINT fk_item_tag_tag_id_ref_tag_id FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "item_tag" DROP CONSTRAINT IF EXISTS fk_item_tag_tag_id_ref_tag_id`);
        await queryRunner.query(`ALTER TABLE "transfer" DROP CONSTRAINT IF EXISTS fk_transfer_target_account_id_ref_account_id`);
        await queryRunner.query(`ALTER TABLE "transfer" DROP CONSTRAINT IF EXISTS fk_transfer_currency_symbol_ref_currency_symbol`);
        await queryRunner.query(`ALTER TABLE "transfer" ALTER COLUMN "target_account_id" DROP NOT NULL`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_tag_on_name`);
        await queryRunner.query(`ALTER TABLE "tag" ADD CONSTRAINT tag_name_key UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "transfer" ADD CONSTRAINT fk_transfer_currency_symbol_ref_currency_symbol FOREIGN KEY ("currency_symbol") REFERENCES currency("symbol") ON DELETE RESTRICT ON UPDATE RESTRICT`);
        await queryRunner.query(`ALTER TABLE "transfer" ADD CONSTRAINT fk_transfer_target_account_id_ref_account_id FOREIGN KEY ("target_account_id") REFERENCES account("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "item_tag" ADD CONSTRAINT fk_item_tag_tag_id_ref_tag_id FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }
}
