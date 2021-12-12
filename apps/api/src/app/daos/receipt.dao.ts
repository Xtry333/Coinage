import { Injectable } from '@nestjs/common';
import { DeleteResult, Equal, getConnection, InsertResult } from 'typeorm';
import { Receipt } from '../entities/Receipt.entity';

@Injectable()
export class ReceiptDao {
    async getById(id: number): Promise<Receipt> {
        const receipt = await getConnection()
            .getRepository(Receipt)
            .findOne({ where: { id: Equal(id) } });
        if (!receipt) {
            throw new Error('Receipt not found');
        }
        return receipt;
    }

    async getByTransferId(transferId: number): Promise<Receipt[]> {
        const receipt = await getConnection()
            .getRepository(Receipt)
            .find({
                where: { transferId: Equal(transferId) },
            });
        receipt.forEach(async (r) => {
            await r.transfers;
        });
        return receipt;
    }

    getAll() {
        return getConnection()
            .getRepository(Receipt)
            .find({ order: { date: 'DESC', id: 'DESC' } });
    }

    async insert(receipt: Receipt): Promise<InsertResult> {
        return await getConnection().getRepository(Receipt).insert(receipt);
    }

    async save(receipt: Receipt): Promise<Receipt> {
        return await getConnection().getRepository(Receipt).save(receipt);
    }

    async deleteById(id: number): Promise<DeleteResult> {
        return await getConnection()
            .getRepository(Receipt)
            .delete({ id: Equal(id) });
    }
}
