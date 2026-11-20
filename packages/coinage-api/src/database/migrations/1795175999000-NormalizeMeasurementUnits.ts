import { MigrationInterface, QueryRunner } from 'typeorm';

// Run before the packaging backfill, which recognizes lowercase legacy size units.
// On databases that already have packaging, normalize existing snapshots as well.
export class NormalizeMeasurementUnits1795175999000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const targets: [string, string[]][] = [
            ['item', ['container_size_unit']],
            ['container', ['weight_unit', 'volume_unit']],
        ];
        // Match the schema used by the UPDATEs, not the driver's cached default schema.
        const schema = await queryRunner.getCurrentSchema();
        if (await queryRunner.hasTable(schema ? `${schema}.item_packaging` : 'item_packaging')) {
            targets.push(['item_packaging', ['weight_unit', 'volume_unit']]);
        }

        for (const [table, columns] of targets) {
            const assignments = columns.map((column) => `"${column}" = LOWER(BTRIM("${column}"))`).join(', ');
            const changed = columns.map((column) => `"${column}" IS DISTINCT FROM LOWER(BTRIM("${column}"))`).join(' OR ');
            await queryRunner.query(`UPDATE "${table}" SET ${assignments} WHERE ${changed}`);
        }
    }

    public async down(): Promise<void> {
        // Original casing/spacing cannot be reconstructed. Keep canonical units on rollback.
    }
}
