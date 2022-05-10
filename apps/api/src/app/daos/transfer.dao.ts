import { GetFilteredTransfersRequest, Range } from '@coinage-app/interfaces';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    Between,
    DeleteResult,
    Equal,
    FindOperator,
    FindOptionsWhere,
    getConnection,
    ILike,
    In,
    InsertResult,
    IsNull,
    LessThanOrEqual,
    Repository,
} from 'typeorm';
import { Transfer } from '../entities/Transfer.entity';
import { TemplateNameMapperService } from '../services/template-name-mapper.service';

type KeysOfType<O, T> = {
    [P in keyof Required<O>]: Required<O>[P] extends T ? P : never;
}[keyof O];

type Writeable<T> = { -readonly [P in keyof T]: T[P] };

@Injectable()
export class TransferDao {
    public constructor(
        @InjectRepository(Transfer)
        private readonly transferRepository: Repository<Transfer>,
        private readonly templateNameMapperService: TemplateNameMapperService
    ) {}

    public async getById(id: number): Promise<Transfer> {
        try {
            const transfer = await this.transferRepository.findOneByOrFail({
                id: Equal(id),
                // join: {
                //     alias: 'transfer',
                //     leftJoinAndSelect: { receipt: 'transfer.receipt', contractor: 'receipt.contractor', transfers: 'receipt.transfers' },
                // },
            });
            // if (!transfer) {
            //     throw new NotFoundException('Transfer not found.');
            // }

            await transfer.category.parent;
            this.templateNameMapperService.mapTransfersTemplateNames([transfer]);
            return transfer;
        } catch (e) {
            throw new NotFoundException('Transfer not found');
        }
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
            order: { date: 'DESC', id: 'DESC' },
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

    private createFilteredFindConditions(params: GetFilteredTransfersRequest): FindOptionsWhere<Transfer> {
        const filter: FindOptionsWhere<Transfer> = {};

        this.assignInFilterIfExists(filter, 'contractorId', params.contractorIds);
        this.assignInFilterIfExists(filter, 'accountId', params.accountIds);
        this.assignInFilterIfExists(filter, 'categoryId', params.categoryIds);
        this.assignInFilterIfExists(filter, 'id', params.transferIds);
        this.assignBetweenFilterIfExists(filter, 'date', params.date);
        this.assignBetweenFilterIfExists(filter, 'amount', params.amount);

        if (params.description) {
            filter.description = ILike(`%${params.description}%`);
        }

        if (!params.showPlanned) {
            filter.date = LessThanOrEqual(new Date());
        }

        return filter;
    }

    private assignInFilterIfExists(filter: FindOptionsWhere<Transfer>, key: KeysOfType<Transfer, number | null>, values?: number[]) {
        if (values && values.length > 0) {
            filter[key] = In(values);
        }
    }

    private assignBetweenFilterIfExists(
        filter: FindOptionsWhere<Transfer>,
        key: KeysOfType<Transfer, string | number | null | Date>,
        range?: Range<string | number | null | Date>
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
            .leftJoinAndSelect('transfer.account', 'account')
            .leftJoinAndSelect('transfer.category', 'category')
            .leftJoinAndSelect('transfer.contractor', 'contractor')
            .leftJoinAndSelect('account.user', 'user')
            .orderBy('transfer.editedDate', 'DESC')
            .addOrderBy('transfer.id', 'DESC')
            .where('user.id = :userId', { userId })
            .take(count)
            .getMany();

        this.templateNameMapperService.mapTransfersTemplateNames(transfers);
        return transfers;
    }

    public async getTransferByDateContractor(date: Date, contractorId: number | null): Promise<Transfer[]> {
        const whereOptions: FindOptionsWhere<Transfer> = { date: Equal(date) };
        if (contractorId) {
            whereOptions.contractorId = Equal(contractorId);
        } else {
            whereOptions.contractorId = IsNull();
        }
        const transfers = await this.transferRepository.find({ where: whereOptions, order: { createdDate: 'DESC' } });

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
        return (await this.transferRepository.delete({ isEthereal: Equal(true) })).affected ?? 0;
    }
}
