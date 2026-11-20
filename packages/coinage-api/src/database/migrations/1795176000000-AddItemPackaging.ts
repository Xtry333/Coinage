import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddItemPackaging1795176000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE item_packaging (
                id SERIAL PRIMARY KEY,
                item_id INT NOT NULL,
                container_id INT,
                weight DOUBLE PRECISION, weight_unit VARCHAR(8),
                volume DOUBLE PRECISION, volume_unit VARCHAR(8),
                item_count INT, barcode VARCHAR(64),
                is_preferred BOOLEAN NOT NULL DEFAULT FALSE,
                is_archived BOOLEAN NOT NULL DEFAULT FALSE,
                CONSTRAINT uq_item_packaging_identity UNIQUE (id, item_id),
                CONSTRAINT fk_item_packaging_item FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE RESTRICT,
                CONSTRAINT fk_item_packaging_container FOREIGN KEY (container_id) REFERENCES container(id) ON DELETE RESTRICT
            )
        `);
        await queryRunner.query(`CREATE INDEX idx_item_packaging_item ON item_packaging(item_id)`);
        await queryRunner.query(`CREATE UNIQUE INDEX uq_item_packaging_preferred ON item_packaging(item_id) WHERE is_preferred AND NOT is_archived`);
        await queryRunner.query(`ALTER TABLE transfer_item ADD COLUMN packaging_id INT`);
        await queryRunner.query(`
            ALTER TABLE transfer_item ADD CONSTRAINT fk_transfer_item_packaging_item
            FOREIGN KEY (packaging_id, item_id) REFERENCES item_packaging(id, item_id) ON DELETE RESTRICT
        `);
        await queryRunner.query(`CREATE INDEX idx_transfer_item_packaging ON transfer_item(packaging_id)`);

        // Each product gets its own immutable net-content snapshot of its shared legacy container.
        await queryRunner.query(`
            INSERT INTO item_packaging (item_id, container_id, weight, weight_unit, volume, volume_unit, item_count)
            SELECT DISTINCT ti.item_id, c.id, c.weight, c.weight_unit, c.volume, c.volume_unit, c.item_count
            FROM transfer_item ti JOIN container c ON c.id = ti.container_id
        `);
        await queryRunner.query(`
            UPDATE transfer_item ti SET packaging_id = p.id
            FROM item_packaging p WHERE p.item_id = ti.item_id AND p.container_id = ti.container_id
        `);
        // Preserve deprecated per-item sizes too, including unused catalog products.
        await queryRunner.query(`
            INSERT INTO item_packaging (item_id, weight, weight_unit, volume, volume_unit)
            SELECT id,
                CASE WHEN container_size_unit IN ('g', 'kg') THEN container_size END,
                CASE WHEN container_size_unit IN ('g', 'kg') THEN container_size_unit END,
                CASE WHEN container_size_unit IN ('ml', 'cl', 'l') THEN container_size END,
                CASE WHEN container_size_unit IN ('ml', 'cl', 'l') THEN container_size_unit END
            FROM item WHERE container_size IS NOT NULL AND container_size_unit IN ('g', 'kg', 'ml', 'cl', 'l')
        `);
        await queryRunner.query(`
            UPDATE transfer_item ti SET packaging_id = p.id FROM item_packaging p
            WHERE ti.packaging_id IS NULL AND ti.container_id IS NULL AND p.item_id = ti.item_id AND p.container_id IS NULL
        `);
        await queryRunner.query(`
            WITH ranked AS (
                SELECT p.id, ROW_NUMBER() OVER (PARTITION BY p.item_id ORDER BY MAX(t.date) DESC NULLS LAST, p.id) AS rank
                FROM item_packaging p LEFT JOIN transfer_item ti ON ti.packaging_id = p.id
                LEFT JOIN transfer t ON t.id = ti.transfer_id GROUP BY p.id
            )
            UPDATE item_packaging p SET is_preferred = TRUE FROM ranked r WHERE r.id = p.id AND r.rank = 1
        `);
        await queryRunner.query(`
            CREATE OR REPLACE VIEW items_with_containers AS
            SELECT item.id AS item_id, item.brand AS item_brand, item.name AS item_name,
                item.category_id AS item_category_id, item.container_size AS item_container_size,
                item.container_size_unit AS item_container_size_unit, item.created_date AS item_created_date,
                item.edited_date AS item_updated_date, c.id AS container_id, c.name AS container_name,
                p.weight AS container_weight, p.weight_unit AS container_weight_unit,
                p.volume AS container_volume, p.volume_unit AS container_volume_unit, p.item_count AS container_item_count,
                p.id AS packaging_id
            FROM item_packaging p JOIN item ON item.id = p.item_id
            JOIN container c ON c.id = p.container_id WHERE NOT p.is_archived
        `);
    }

    public async down(): Promise<void> {
        // Multiple product-specific sizes cannot be represented losslessly by a shared legacy container.
        throw new Error('Item packaging cannot be rolled back without losing catalog variants. Restore a database backup instead.');
    }
}
