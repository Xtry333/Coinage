import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, DeleteResult, Equal, InsertResult, Repository } from 'typeorm';
import { Receipt } from '../entities/Receipt.entity';
import { TemplateNameMapperService } from '../services/template-name-mapper.service';
import { BaseDao } from './base.dao';

@Injectable()
export class ReceiptDao extends BaseDao {
    public constructor(
        @InjectRepository(Receipt) private readonly receiptRepository: Repository<Receipt>,
        private readonly templateNameMapperService: TemplateNameMapperService,
        private readonly dataSource: DataSource,
    ) {
        super();
    }

    public async getById(id: number): Promise<Receipt> {
        let receipt = await this.receiptRepository.findOne({
            where: { id: Equal(id) },
            order: {
                transfers: {
                    date: 'DESC',
                    description: 'ASC',
                },
            },
        });
        receipt = this.validateNotNullById(Receipt.name, id, receipt);

        this.templateNameMapperService.mapTransfersTemplateNames(receipt.transfers);
        return receipt;
    }

    public getAll() {
        return this.dataSource.getRepository(Receipt).find({ order: { date: 'DESC', id: 'DESC' } });
    }

    public async insert(receipt: Receipt): Promise<InsertResult> {
        return await this.dataSource.getRepository(Receipt).insert(receipt);
    }

    public async save(receipt: Receipt): Promise<Receipt> {
        return await this.dataSource.getRepository(Receipt).save(receipt);
    }

    public async deleteById(id: number): Promise<DeleteResult> {
        return await this.dataSource.getRepository(Receipt).delete({ id: Equal(id) });
    }
}
