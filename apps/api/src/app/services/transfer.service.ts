import { Injectable } from '@angular/core';
import { Equal, getConnection } from 'typeorm';
import { Transfer } from '../entity/Transfer.entity';

@Injectable({
    providedIn: 'root',
})
export class TransferService {
    async getById(id: number): Promise<Transfer> {
        const transfer = await getConnection()
            .getRepository(Transfer)
            .findOne({ where: { id: Equal(id) } });
        if (!transfer) {
            throw new Error('Transfer not found');
        }
        await transfer.category.parent;
        return transfer;
    }
}
