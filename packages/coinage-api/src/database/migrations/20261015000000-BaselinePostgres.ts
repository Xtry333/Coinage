import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Baseline migration for PostgreSQL.
 *
 * This migration creates the entire Coinage schema in native PostgreSQL syntax,
 * superseding all legacy MySQL migrations (1000000000000 through 1773784743746)
 * which relied on MySQL-specific constructs (`ENGINE=InnoDB`, `COLLATE`,
 * `BIT(1)`, `AUTO_INCREMENT`, `ENUM(...)`, `json_object()`, backticks, etc.).
 *
 * Treat this as a one-way door: the `down()` is destructive and exists only for
 * completeness on a fresh database. Existing MySQL data must be migrated via a
 * separate data-migration/cutover process.
 *
 * Table creation order respects foreign-key dependencies.
 */
export class BaselinePostgres20261015000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void>
    {
        // -- user -----------------------------------------------------------
        await queryRunner.query(`
            CREATE TABLE "user" (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                password VARCHAR(64) NULL,
                is_system_user BOOLEAN NOT NULL DEFAULT false,
                created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // -- group ----------------------------------------------------------
        await queryRunner.query(`
            CREATE TABLE "group" (
                id SERIAL PRIMARY KEY,
                name VARCHAR(64) NOT NULL
            );
        `);

        // -- currency -------------------------------------------------------
        await queryRunner.query(`
            CREATE TABLE currency (
                symbol VARCHAR(16) PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                shorthand VARCHAR(16) NOT NULL
            );
        `);

        // -- account --------------------------------------------------------
        await queryRunner.query(`
            CREATE TABLE account (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                currency_symbol VARCHAR(16) NOT NULL,
                user_id INT NOT NULL,
                is_contractor_account BOOLEAN NOT NULL DEFAULT false,
                is_active BOOLEAN NOT NULL DEFAULT true,
                edited_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT FK_account_currency_symbol_REF_currency_symbol FOREIGN KEY (currency_symbol) REFERENCES currency(symbol) ON UPDATE RESTRICT ON DELETE RESTRICT,
                CONSTRAINT FK_account_user_id_REF_user_id FOREIGN KEY (user_id) REFERENCES "user"(id) ON UPDATE RESTRICT ON DELETE RESTRICT
            );
        `);

        // -- user_group -----------------------------------------------------
        await queryRunner.query(`
            CREATE TABLE user_group (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL,
                group_id INT NOT NULL,
                CONSTRAINT FK_user_group_user_id_REF_user_id FOREIGN KEY (user_id) REFERENCES "user"(id) ON UPDATE CASCADE ON DELETE CASCADE,
                CONSTRAINT FK_user_group_group_id_REF_group_id FOREIGN KEY (group_id) REFERENCES "group"(id) ON UPDATE CASCADE ON DELETE CASCADE
            );
        `);

        // -- category -------------------------------------------------------
        await queryRunner.query(`
            CREATE TABLE category (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE,
                description TEXT NULL,
                parent_id INT NULL,
                user_id INT NULL,
                type VARCHAR(10) NOT NULL DEFAULT 'OUTCOME' CHECK (type IN ('INCOME', 'OUTCOME')),
                tag VARCHAR(64) NULL UNIQUE,
                CONSTRAINT FK_category_parent_id_REF_category_id FOREIGN KEY (parent_id) REFERENCES category(id) ON UPDATE CASCADE ON DELETE SET NULL,
                CONSTRAINT FK_category_user_id_REF_user_id FOREIGN KEY (user_id) REFERENCES "user"(id) ON UPDATE RESTRICT ON DELETE RESTRICT
            );
        `);

        // -- contractor -----------------------------------------------------
        await queryRunner.query(`
            CREATE TABLE contractor (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                is_active BOOLEAN NOT NULL DEFAULT true
            );
        `);

        // -- schedule -------------------------------------------------------
        await queryRunner.query(`
            CREATE TABLE schedule (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                recurrence VARCHAR(10) NOT NULL DEFAULT 'MONTHLY' CHECK (recurrence IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM')),
                start_date TIMESTAMP NOT NULL,
                count INT NOT NULL,
                metadata JSONB NULL,
                edited_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // -- receipt --------------------------------------------------------
        await queryRunner.query(`
            CREATE TABLE receipt (
                id SERIAL PRIMARY KEY,
                description TEXT NULL,
                amount DECIMAL(20,2) NOT NULL DEFAULT 0.00,
                date DATE NOT NULL DEFAULT CURRENT_DATE,
                contractor_id INT NULL,
                image_path VARCHAR(500) NULL DEFAULT NULL,
                image_hash VARCHAR(64) NULL DEFAULT NULL,
                processing_status VARCHAR(20) NOT NULL DEFAULT 'NONE' CHECK (processing_status IN ('NONE','PENDING','PROCESSING','EXTRACTED','PROCESSED','DUPLICATE','ERROR')),
                ai_extracted_data JSONB NULL DEFAULT NULL,
                raw_ai_response TEXT NULL DEFAULT NULL,
                CONSTRAINT FK_receipt_contractor_id_REF_contractor_id FOREIGN KEY (contractor_id) REFERENCES contractor(id) ON UPDATE CASCADE ON DELETE SET NULL
            );
        `);

        // -- transfer -------------------------------------------------------
        await queryRunner.query(`
            CREATE TABLE transfer (
                id SERIAL PRIMARY KEY,
                description TEXT NOT NULL,
                amount DECIMAL(20,2) NOT NULL DEFAULT 0.00,
                currency_symbol VARCHAR(16) NOT NULL,
                date DATE NOT NULL DEFAULT CURRENT_DATE,
                accounting_date DATE NULL,
                category_id INT NOT NULL,
                contractor_id INT NULL,
                owner_user_id INT NULL,
                receipt_id INT NULL,
                type VARCHAR(10) NOT NULL DEFAULT 'OUTCOME' CHECK (type IN ('INCOME', 'OUTCOME')),
                schedule_id INT NULL,
                origin_account_id INT NOT NULL,
                target_account_id INT NULL,
                is_ethereal BOOLEAN NOT NULL DEFAULT false,
                is_flagged BOOLEAN NOT NULL DEFAULT false,
                edited_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                created_date TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
                CONSTRAINT FK_transfer_currency_symbol_REF_currency_symbol FOREIGN KEY (currency_symbol) REFERENCES currency(symbol) ON UPDATE RESTRICT ON DELETE RESTRICT,
                CONSTRAINT FK_transfer_category_id_REF_category_id FOREIGN KEY (category_id) REFERENCES category(id) ON UPDATE CASCADE ON DELETE RESTRICT,
                CONSTRAINT FK_transfer_contractor_id_REF_contractor_id FOREIGN KEY (contractor_id) REFERENCES contractor(id) ON UPDATE CASCADE ON DELETE SET NULL,
                CONSTRAINT FK_transfer_owner_user_id_REF_user_id FOREIGN KEY (owner_user_id) REFERENCES "user"(id) ON UPDATE CASCADE ON DELETE RESTRICT,
                CONSTRAINT FK_transfer_receipt_id_REF_receipt_id FOREIGN KEY (receipt_id) REFERENCES receipt(id) ON UPDATE CASCADE ON DELETE SET NULL,
                CONSTRAINT FK_transfer_schedule_id_REF_schedule_id FOREIGN KEY (schedule_id) REFERENCES schedule(id) ON UPDATE CASCADE ON DELETE SET NULL,
                CONSTRAINT FK_transfer_origin_account_id_REF_account_id FOREIGN KEY (origin_account_id) REFERENCES account(id) ON UPDATE CASCADE ON DELETE RESTRICT,
                CONSTRAINT FK_transfer_target_account_id_REF_account_id FOREIGN KEY (target_account_id) REFERENCES account(id) ON UPDATE CASCADE ON DELETE RESTRICT
            );
        `);

        // -- item -----------------------------------------------------------
        await queryRunner.query(`
            CREATE TABLE item (
                id SERIAL PRIMARY KEY,
                brand VARCHAR(50) NULL,
                name VARCHAR(50) NOT NULL,
                category_id INT NULL,
                container_size FLOAT NULL,
                container_size_unit VARCHAR(16) NULL,
                created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                edited_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT FK_item_category_id_REF_category_id FOREIGN KEY (category_id) REFERENCES category(id) ON UPDATE CASCADE ON DELETE SET NULL
            );
        `);

        // -- container ------------------------------------------------------
        await queryRunner.query(`
            CREATE TABLE container (
                id SERIAL PRIMARY KEY,
                name VARCHAR(64) NULL,
                weight FLOAT NULL,
                weight_unit VARCHAR(8) NULL,
                volume FLOAT NULL,
                volume_unit VARCHAR(8) NULL,
                item_count INT NULL
            );
        `);

        // -- tag ------------------------------------------------------------
        await queryRunner.query(`
            CREATE TABLE tag (
                id SERIAL PRIMARY KEY,
                name VARCHAR(64) NOT NULL UNIQUE,
                color VARCHAR(7) NULL
            );
        `);

        // -- transfer_item --------------------------------------------------
        await queryRunner.query(`
            CREATE TABLE transfer_item (
                id SERIAL PRIMARY KEY,
                unit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                total_set_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                total_set_discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                quantity FLOAT NOT NULL DEFAULT 1,
                transfer_id INT NOT NULL,
                item_id INT NOT NULL,
                container_id INT NULL,
                CONSTRAINT FK_transfer_item_transfer_id_REF_transfer_id FOREIGN KEY (transfer_id) REFERENCES transfer(id) ON UPDATE CASCADE ON DELETE CASCADE,
                CONSTRAINT FK_transfer_item_item_id_REF_item_id FOREIGN KEY (item_id) REFERENCES item(id) ON UPDATE CASCADE ON DELETE RESTRICT,
                CONSTRAINT FK_transfer_item_container_id_REF_container_id FOREIGN KEY (container_id) REFERENCES container(id) ON UPDATE CASCADE ON DELETE RESTRICT
            );
        `);

        // -- item_tag -------------------------------------------------------
        await queryRunner.query(`
            CREATE TABLE item_tag (
                item_id INT NOT NULL,
                tag_id INT NOT NULL,
                PRIMARY KEY (item_id, tag_id),
                CONSTRAINT FK_item_tag_item_id_REF_item_id FOREIGN KEY (item_id) REFERENCES item(id) ON UPDATE CASCADE ON DELETE CASCADE,
                CONSTRAINT FK_item_tag_tag_id_REF_tag_id FOREIGN KEY (tag_id) REFERENCES tag(id) ON UPDATE CASCADE ON DELETE CASCADE
            );
        `);

        // -- indexes --------------------------------------------------------
        await queryRunner.query(`CREATE INDEX IDX_account_user_id ON account(user_id);`);
        await queryRunner.query(`CREATE INDEX IDX_account_currency_symbol ON account(currency_symbol);`);
        await queryRunner.query(`CREATE INDEX IDX_category_parent_id ON category(parent_id);`);
        await queryRunner.query(`CREATE INDEX IDX_category_user_id ON category(user_id);`);
        await queryRunner.query(`CREATE INDEX IDX_receipt_contractor_id ON receipt(contractor_id);`);
        await queryRunner.query(`CREATE INDEX IDX_transfer_receipt_id ON transfer(receipt_id);`);
        await queryRunner.query(`CREATE INDEX IDX_transfer_contractor_id ON transfer(contractor_id);`);
        await queryRunner.query(`CREATE INDEX IDX_transfer_category_id ON transfer(category_id);`);
        await queryRunner.query(`CREATE INDEX IDX_transfer_origin_account_id ON transfer(origin_account_id);`);
        await queryRunner.query(`CREATE INDEX IDX_transfer_target_account_id ON transfer(target_account_id);`);
        await queryRunner.query(`CREATE INDEX IDX_transfer_schedule_id ON transfer(schedule_id);`);
        await queryRunner.query(`CREATE INDEX IDX_transfer_owner_user_id ON transfer(owner_user_id);`);
        await queryRunner.query(`CREATE INDEX IDX_transfer_item_transfer_id ON transfer_item(transfer_id);`);
        await queryRunner.query(`CREATE INDEX IDX_transfer_item_item_id ON transfer_item(item_id);`);
        await queryRunner.query(`CREATE INDEX IDX_transfer_item_container_id ON transfer_item(container_id);`);
        await queryRunner.query(`CREATE INDEX IDX_user_group_user_id ON user_group(user_id);`);
        await queryRunner.query(`CREATE INDEX IDX_user_group_group_id ON user_group(group_id);`);
        await queryRunner.query(`CREATE INDEX IDX_item_category_id ON item(category_id);`);
    }

    public async down(queryRunner: QueryRunner): Promise<void>
    {
        // Destructive: drops all tables created by up(). One-way door.
        await queryRunner.query(`DROP TABLE IF EXISTS item_tag CASCADE;`);
        await queryRunner.query(`DROP TABLE IF EXISTS tag CASCADE;`);
        await queryRunner.query(`DROP TABLE IF EXISTS transfer_item CASCADE;`);
        await queryRunner.query(`DROP TABLE IF EXISTS container CASCADE;`);
        await queryRunner.query(`DROP TABLE IF EXISTS item CASCADE;`);
        await queryRunner.query(`DROP TABLE IF EXISTS transfer CASCADE;`);
        await queryRunner.query(`DROP TABLE IF EXISTS schedule CASCADE;`);
        await queryRunner.query(`DROP TABLE IF EXISTS receipt CASCADE;`);
        await queryRunner.query(`DROP TABLE IF EXISTS contractor CASCADE;`);
        await queryRunner.query(`DROP TABLE IF EXISTS category CASCADE;`);
        await queryRunner.query(`DROP TABLE IF EXISTS user_group CASCADE;`);
        await queryRunner.query(`DROP TABLE IF EXISTS "group" CASCADE;`);
        await queryRunner.query(`DROP TABLE IF EXISTS account CASCADE;`);
        await queryRunner.query(`DROP TABLE IF EXISTS currency CASCADE;`);
        await queryRunner.query(`DROP TABLE IF EXISTS "user" CASCADE;`);
    }
}
