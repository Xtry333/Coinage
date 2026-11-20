import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPackagingComposition1795176001000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE item_packaging
                ADD COLUMN name VARCHAR(64),
                ADD COLUMN contained_packaging_id INT,
                ADD COLUMN contained_count INT
        `);
        // Copy labels once; new packaging names are independent of the legacy shared container.
        await queryRunner.query(`
            UPDATE item_packaging p SET name = COALESCE(
                NULLIF(BTRIM((SELECT c.name FROM container c WHERE c.id = p.container_id)), ''),
                'Package ' || p.id
            )
        `);
        await queryRunner.query(`
            ALTER TABLE item_packaging
                ALTER COLUMN name SET NOT NULL,
                ALTER COLUMN name SET DEFAULT 'Package',
                ADD CONSTRAINT ck_item_packaging_name CHECK (LENGTH(BTRIM(name)) > 0),
                ADD CONSTRAINT fk_item_packaging_contained_item
                    FOREIGN KEY (contained_packaging_id, item_id) REFERENCES item_packaging(id, item_id) ON DELETE RESTRICT,
                ADD CONSTRAINT ck_item_packaging_not_self CHECK (contained_packaging_id IS NULL OR contained_packaging_id <> id),
                ADD CONSTRAINT ck_item_packaging_contained_count CHECK (
                    (contained_packaging_id IS NULL AND contained_count IS NULL) OR
                    (contained_packaging_id IS NOT NULL AND contained_count IS NOT NULL AND contained_count > 0)
                ),
                ADD CONSTRAINT ck_item_packaging_leaf_contents CHECK (
                    contained_packaging_id IS NULL OR
                    (weight IS NULL AND weight_unit IS NULL AND volume IS NULL AND volume_unit IS NULL AND item_count IS NULL)
                )
        `);
        await queryRunner.query(`CREATE INDEX idx_item_packaging_contained ON item_packaging(contained_packaging_id)`);
        await queryRunner.query(`
            CREATE FUNCTION item_packaging_prevent_cycles() RETURNS TRIGGER LANGUAGE plpgsql AS $$
            DECLARE
                invalid BOOLEAN;
                child_depth INT;
                parent_depth INT;
            BEGIN
                IF NEW.contained_packaging_id IS NULL THEN RETURN NEW; END IF;
                PERFORM 1 FROM item WHERE id = NEW.item_id FOR UPDATE;
                WITH RECURSIVE chain AS (
                    SELECT id, contained_packaging_id, ARRAY[id] AS path, 1 AS depth
                    FROM item_packaging WHERE id = NEW.contained_packaging_id AND item_id = NEW.item_id
                    UNION ALL
                    SELECT p.id, p.contained_packaging_id, c.path || p.id, c.depth + 1
                    FROM item_packaging p JOIN chain c ON p.id = c.contained_packaging_id
                    WHERE NOT (p.id = ANY(c.path)) AND c.depth < 32
                )
                SELECT COALESCE(BOOL_OR(id = NEW.id OR contained_packaging_id = ANY(path) OR depth >= 32), FALSE),
                    COALESCE(MAX(depth), 0)
                    INTO invalid, child_depth FROM chain;
                -- A direct update must also keep every existing outer package within the limit.
                IF TG_OP = 'UPDATE' THEN
                    WITH RECURSIVE parents AS (
                        SELECT id, 1 AS depth FROM item_packaging WHERE contained_packaging_id = NEW.id
                        UNION ALL
                        SELECT p.id, a.depth + 1
                        FROM item_packaging p JOIN parents a ON p.contained_packaging_id = a.id
                        WHERE a.depth < 32
                    )
                    SELECT COALESCE(MAX(depth), 0) INTO parent_depth FROM parents;
                    invalid := invalid OR child_depth + parent_depth >= 32;
                END IF;
                IF invalid THEN
                    RAISE EXCEPTION 'Packaging cannot form a cycle or exceed 32 nesting levels' USING ERRCODE = '23514';
                END IF;
                RETURN NEW;
            END $$
        `);
        await queryRunner.query(`
            CREATE TRIGGER trg_item_packaging_prevent_cycles
            BEFORE INSERT OR UPDATE OF contained_packaging_id, contained_count, item_id ON item_packaging
            FOR EACH ROW EXECUTE FUNCTION item_packaging_prevent_cycles()
        `);
        await queryRunner.query(`
            CREATE VIEW item_packaging_contents AS
            WITH RECURSIVE contents AS (
                SELECT id, weight, weight_unit, volume, volume_unit, item_count::numeric AS item_count, 1 AS nesting_depth
                FROM item_packaging WHERE contained_packaging_id IS NULL
                UNION ALL
                SELECT p.id, c.weight * p.contained_count, c.weight_unit,
                    c.volume * p.contained_count, c.volume_unit,
                    COALESCE(c.item_count, 1) * p.contained_count, c.nesting_depth + 1
                FROM item_packaging p JOIN contents c ON c.id = p.contained_packaging_id
                WHERE c.nesting_depth < 32
            )
            SELECT c.*, child.name AS contained_name
            FROM contents c JOIN item_packaging p ON p.id = c.id
            LEFT JOIN item_packaging child ON child.id = p.contained_packaging_id
        `);
        await queryRunner.query(`DROP VIEW items_with_containers`);
        await queryRunner.query(`
            CREATE VIEW items_with_containers AS
            SELECT item.id AS item_id, item.brand AS item_brand, item.name AS item_name,
                item.category_id AS item_category_id, item.container_size AS item_container_size,
                item.container_size_unit AS item_container_size_unit, item.created_date AS item_created_date,
                item.edited_date AS item_updated_date, c.id AS container_id, p.name AS container_name,
                contents.weight AS container_weight, contents.weight_unit AS container_weight_unit,
                contents.volume AS container_volume, contents.volume_unit AS container_volume_unit,
                contents.item_count AS container_item_count, p.id AS packaging_id
            FROM item_packaging p JOIN item ON item.id = p.item_id
            JOIN item_packaging_contents contents ON contents.id = p.id
            LEFT JOIN container c ON c.id = p.container_id WHERE NOT p.is_archived
        `);
    }

    public async down(): Promise<void> {
        throw new Error('Nested packaging cannot be represented by the old flat schema. Restore a database backup to roll back.');
    }
}
