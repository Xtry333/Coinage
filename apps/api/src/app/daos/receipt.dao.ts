import { Injectable } from '@nestjs/common';
import { DeleteResult, Equal, getConnection, InsertResult } from 'typeorm';
import { Receipt } from '../entities/Receipt.entity';
import { TemplateNameMapperService } from '../services/template-name-mapper.service';

@Injectable()
export class ReceiptDao {
    public constructor(private readonly templateNameMapperService: TemplateNameMapperService) {}

    public async getById(id: number): Promise<Receipt> {
        const receipt = await getConnection()
            .getRepository(Receipt)
            .findOne({ where: { id: Equal(id) } });
        if (!receipt) {
            throw new Error('Receipt not found');
        }

        this.templateNameMapperService.mapTransfersTemplateNames(receipt.transfers);
        return receipt;
    }

    public getAll() {
        return getConnection()
            .getRepository(Receipt)
            .find({ order: { date: 'DESC', id: 'DESC' } });
    }

    public async insert(receipt: Receipt): Promise<InsertResult> {
        return await getConnection().getRepository(Receipt).insert(receipt);
    }

    public async save(receipt: Receipt): Promise<Receipt> {
        return await getConnection().getRepository(Receipt).save(receipt);
    }

    public async deleteById(id: number): Promise<DeleteResult> {
        return await getConnection()
            .getRepository(Receipt)
            .delete({ id: Equal(id) });
    }
}
