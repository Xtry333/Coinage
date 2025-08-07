import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DeleteResult, Equal, FindOptionsWhere, ILike, In, InsertResult, IsNull, LessThanOrEqual, Repository } from 'typeorm';

import { GetFilteredTransfersRequest, Range, TransferType } from '@coinage-app/interfaces';

import { BaseDao } from './base.dao';
import { Transfer } from '../entities/Transfer.entity';
import { TemplateNameMapperService } from '../services/template-name-mapper.service';
import { Writeable } from '../types/Writeable.type';

type KeysOfType<O, T> = {
    [P in keyof Required<O>]: Required<O>[P] extends T ? P : never;
}[keyof O];

@Injectable()
export class TransferDao extends BaseDao {
    public constructor(
        @InjectRepository(Transfer) private readonly transferRepository: Repository<Transfer>,
        private readonly templateNameMapperService: TemplateNameMapperService,
    ) {
        super();
    }

    public async getById(id: number): Promise<Transfer> {
        let transfer = await this.transferRepository.findOneBy({ id: Equal(id) });
        transfer = this.validateNotNullById(Transfer.name, id, transfer);
        await transfer.category.parent;
        const transferType = this.getTransferType(transfer);
        this.templateNameMapperService.mapTransfersTemplateNames([transfer]);
        transfer.type = transferType.value;
        return transfer;
    }

    public async getAll() {
        const transfers = await this.transferRepository.find({ order: { date: 'DESC', id: 'DESC' } });
        this.templateNameMapperService.mapTransfersTemplateNames(transfers);
        return transfers;
    }

    public async getAllFilteredPaged(params: GetFilteredTransfersRequest): Promise<Transfer[]> {
        const filter = this.createFilteredFindConditions(params);

        const transfers = await this.transferRepository.find({
            where: filter,
            order: { date: 'DESC', contractor: { name: 'ASC' }, description: 'ASC' },
            take: params.rowsPerPage,
            skip: params.rowsPerPage * (params.page - 1),
        });

        this.templateNameMapperService.mapTransfersTemplateNames(transfers);
        return transfers;
    }

    public getAllFilteredCount(params: GetFilteredTransfersRequest): Promise<number> {
        const filter = this.createFilteredFindConditions(params);

        return this.transferRepository.count({ where: filter, order: { date: 'DESC', id: 'DESC' } });
    }

    private createFilteredFindConditions(params: GetFilteredTransfersRequest): FindOptionsWhere<Transfer> | FindOptionsWhere<Transfer>[] {
        const filterArray: FindOptionsWhere<Transfer>[] = [];
        const accountKeys: KeysOfType<Transfer, number | null>[] = ['originAccountId', 'targetAccountId'];
        for (const accountKey of accountKeys) {
            if (filterArray.length > 0) {
                break;
            }
            const filter: FindOptionsWhere<Transfer> = {};

            this.assignInFilterIfExists(filter, 'contractorId', params.contractorIds);
            this.assignInFilterIfExists(filter, accountKey, params.accountIds);
            this.assignInFilterIfExists(filter, 'categoryId', params.categoryIds);
            this.assignInFilterIfExists(filter, 'id', params.transferIds);
            this.assignBetweenFilterIfExists(filter, 'date', params.date);
            this.assignBetweenFilterIfExists(filter, 'amount', params.amount);

            if (params.description) {
                filter.description = ILike(`%${params.description}%`);
            }

            if (!params.showPlanned && !params.date) {
                filter.date = LessThanOrEqual(new Date());
            }

            if (params.showFlagged) {
                filter.isFlagged = true;
            }
            filterArray.push(filter);
        }
        return filterArray.length === 1 ? filterArray[0] : filterArray;
    }

    private assignInFilterIfExists(filter: FindOptionsWhere<Transfer>, key: KeysOfType<Transfer, number | null>, values?: number[]) {
        if (values && values.length > 0) {
            filter[key] = In(values);
        }
    }

    private assignBetweenFilterIfExists(
        filter: FindOptionsWhere<Transfer>,
        key: KeysOfType<Transfer, string | number | null | Date>,
        range?: Range<string | number | null | Date>,
    ) {
        if (range !== undefined && range.from !== undefined && range.to !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (filter as any)[key] = Between(range.from, range.to);
        }
    }

    public async getRecentlyEditedTransfersForUser(userId: number, count?: number): Promise<Transfer[]> {
        const transfers = await this.transferRepository
            .createQueryBuilder('transfer')
            .select()
            .leftJoinAndSelect('transfer.originAccount', 'originAccount')
            .leftJoinAndSelect('transfer.targetAccount', 'targetAccount')
            .leftJoinAndSelect('transfer.category', 'category')
            .leftJoinAndSelect('transfer.contractor', 'contractor')
            .leftJoinAndSelect('originAccount.user', 'originUser')
            .leftJoinAndSelect('targetAccount.user', 'targetUser')
            .leftJoinAndSelect('transfer.currency', 'currency')
            .orderBy('transfer.editedDate', 'DESC')
            .addOrderBy('transfer.id', 'DESC')
            .where('originUser.id = :userId', { userId })
            .orWhere('targetUser.id = :userId', { userId })
            .take(count)
            .getMany();

        this.templateNameMapperService.mapTransfersTemplateNames(transfers);
        return transfers;
    }

    public async getTransfersByDate(date: Date): Promise<Transfer[]> {
        const whereOptions: FindOptionsWhere<Transfer> = { date: Equal(date) };
        // if (contractorId) {
        //     whereOptions.contractorId = Equal(contractorId);
        // } else {
        //     whereOptions.contractorId = IsNull();
        // }
        const transfers = await this.transferRepository.find({ where: whereOptions, order: { createdDate: 'DESC', description: 'ASC' } });
        this.templateNameMapperService.mapTransfersTemplateNames(transfers);
        return transfers;
    }

    public async getByCategory(categoryId: number) {
        const transfers = await this.transferRepository.find({
            where: { categoryId: Equal(categoryId) },
        });

        this.templateNameMapperService.mapTransfersTemplateNames(transfers);
        return transfers;
    }

    public async insert(transfer: Transfer): Promise<InsertResult> {
        return await this.transferRepository.insert(transfer);
    }

    public async save(transfer: Writeable<Transfer>): Promise<Transfer> {
        transfer.editedDate = new Date();
        return await this.transferRepository.save(transfer);
    }

    public async deleteById(id: number): Promise<DeleteResult> {
        return await this.transferRepository.delete({ id: Equal(id) });
    }

    public async deleteEthereals(): Promise<number> {
        return (await this.transferRepository.delete({ isEthereal: true })).affected ?? 0;
    }

    private getTransferType(transfer: Transfer): TransferType {
        if (transfer.originAccount.userId === transfer.targetAccount?.userId) {
            return TransferType.INTERNAL;
        }
        if (transfer.originAccount.userId === transfer.ownerUserId) {
            return TransferType.OUTCOME;
        }
        return TransferType.INCOME;
    }
}
