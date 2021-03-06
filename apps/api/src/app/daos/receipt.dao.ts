import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Equal, getConnection, InsertResult, Repository } from 'typeorm';
import { Receipt } from '../entities/Receipt.entity';
import { TemplateNameMapperService } from '../services/template-name-mapper.service';
import { BaseDao } from './base.bao';

@Injectable()
export class ReceiptDao extends BaseDao {
    public constructor(
        @InjectRepository(Receipt) private readonly receiptRepository: Repository<Receipt>,
        private readonly templateNameMapperService: TemplateNameMapperService
    ) {
        super();
    }

    public async getById(id: number): Promise<Receipt> {
        let receipt = await this.receiptRepository.findOneBy({ id: Equal(id) });
        receipt = this.validateNotNullById(Receipt.name, id, receipt);

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
