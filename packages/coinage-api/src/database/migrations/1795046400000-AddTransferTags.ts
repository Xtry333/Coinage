import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTransferTags1795046400000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE transfer_tag (
                transfer_id INT NOT NULL,
                tag_id INT NOT NULL,
                PRIMARY KEY (transfer_id, tag_id),
                CONSTRAINT fk_transfer_tag_transfer_id_ref_transfer_id
                    FOREIGN KEY (transfer_id) REFERENCES transfer(id) ON UPDATE CASCADE ON DELETE CASCADE,
                CONSTRAINT fk_transfer_tag_tag_id_ref_tag_id
                    FOREIGN KEY (tag_id) REFERENCES tag(id) ON UPDATE CASCADE ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX idx_transfer_tag_tag_id ON transfer_tag(tag_id)`);
        await queryRunner.query(`CREATE INDEX idx_item_tag_tag_id ON item_tag(tag_id)`);

        // The preceding schema-alignment migration changed this to NO ACTION.
        // Deleting a tag should remove assignments, not delete or block its items.
        await queryRunner.query(`ALTER TABLE item_tag DROP CONSTRAINT fk_item_tag_tag_id_ref_tag_id`);
        await queryRunner.query(`
            ALTER TABLE item_tag ADD CONSTRAINT fk_item_tag_tag_id_ref_tag_id
                FOREIGN KEY (tag_id) REFERENCES tag(id) ON UPDATE CASCADE ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE item_tag DROP CONSTRAINT fk_item_tag_tag_id_ref_tag_id`);
        await queryRunner.query(`
            ALTER TABLE item_tag ADD CONSTRAINT fk_item_tag_tag_id_ref_tag_id
                FOREIGN KEY (tag_id) REFERENCES tag(id) ON UPDATE NO ACTION ON DELETE NO ACTION
        `);
        await queryRunner.query(`DROP INDEX idx_item_tag_tag_id`);
        await queryRunner.query(`DROP TABLE transfer_tag`);
    }
}
