import { MigrationInterface, QueryRunner } from 'typeorm';
import { Transfer } from '../../app/entities/Transfer.entity';

export class FuelMigration1657578654226 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const query = `
            SELECT t.* FROM transfer t
            LEFT JOIN transfer_item ti ON ti.transfer_id = t.id
            LEFT JOIN item i ON ti.item_id = i.id
            JOIN category c ON t.category_id = c.id
            WHERE c.id = 1 AND i.id IS NULL
            `;
        const transfers: Transfer[] = await queryRunner.query(query);
        for (const transfer of transfers) {
            const description = transfer.description.split(' ');
            const price = parseFloat(description[1].replace(',', '.'));
            description[1] = price.toFixed(2);
            transfer.description = description.join(' ');
            const amount = Math.round((transfer.amount / price) * 1000) / 1000;
            console.log(price, amount, transfer.amount);
            queryRunner.query(`
                    INSERT INTO transfer_item(unit_price, quantity, transfer_id, item_id) VALUES(${price.toFixed(2)}, ${amount.toFixed(3)}, ${
                        transfer.id
                    }, ${54})
                `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('No down migration for FuelMigration1657578654226');
    }
}
