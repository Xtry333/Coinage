import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';

import { BaseResponseDTO, SaveTransferDTO, SplitTransferDTO, TotalAmountPerMonthDTO, TransferDetailsDTO, TransferDTO } from '@coinage-app/interfaces';
import { TransferService } from '../services/transfer.service';
import { Category, TransferType } from '../entity/Category.entity';
import { AppService } from '../app.service';
import { CategoryService } from '../services/category.service';
import { Transfer } from '../entity/Transfer.entity';
import { ContractorService } from '../services/contractor.service';

@Controller('transfer')
export class TransfersController {
    constructor(
        private readonly transferService: TransferService,
        private readonly appService: AppService,
        private readonly categoryService: CategoryService,
        private readonly contractorService: ContractorService
    ) {}

    @Get('all')
    async getAllTransactions(): Promise<TransferDTO[]> {
        return (await this.transferService.getAll()).map((t) => {
            return {
                id: t.id,
                description: t.description,
                amount: parseFloat(t.amount),
                type: t.type,
                categoryId: t.category?.id,
                category: t.category?.name,
                contractor: t.contractor?.name,
                date: t.date,
            };
        });
    }

    @Get('recent')
    async getRecentTransactions(): Promise<TransferDTO[]> {
        const recentCount = 10;
        return (await this.transferService.getAllLimited(recentCount)).map((t) => {
            return {
                id: t.id,
                description: t.description,
                amount: parseFloat(t.amount),
                type: t.type,
                categoryId: t.category?.id,
                category: t.category?.name,
                contractor: t.contractor?.name,
                date: t.date,
            };
        });
    }

    @Get('details/:id')
    async getTransferDetails(@Param('id') paramId: string): Promise<TransferDetailsDTO> {
        const id = parseInt(paramId);
        if (!id) {
            throw new Error('Invalid ID provided');
        }
        const transfer = await this.transferService.getById(id);
        const categoryPath: Category[] = [];
        categoryPath.push(transfer.category);
        let parentCat = await transfer.category.parent;
        while (parentCat !== null) {
            if (!categoryPath.find((cat) => cat.id === parentCat?.id)) {
                categoryPath.push(parentCat);
                parentCat = await categoryPath[categoryPath.length - 1]?.parent;
            } else {
                break;
            }
        }

        const otherTransfers: TransferDTO[] = (await this.transferService.getTransferByDateContractor(transfer.date, transfer.contractor?.id ?? 0))
            .filter((t) => t.id !== transfer.id)
            .map((t) => {
                return {
                    id: t.id,
                    description: t.description,
                    amount: parseFloat(t.amount),
                    type: t.type,
                    category: t.category.name,
                    date: t.date,
                    categoryId: t.category.id,
                };
            });

        return {
            id: transfer.id,
            description: transfer.description,
            amount: parseFloat(transfer.amount),
            type: transfer.category.type,
            createdDate: transfer.createdDate,
            editedDate: transfer.editedDate,
            contractor: transfer.contractor?.name,
            contractorId: transfer.contractor?.id,
            categoryId: transfer.category.id,
            account: transfer.account,
            otherTransfers: otherTransfers,
            date: transfer.date,
            categoryPath: categoryPath.reverse().map((cat) => {
                return { id: cat.id, name: cat.name };
            }),
        };
    }

    @Get('/totalOutcomesPerMonth')
    async getLastTotalOutcomesPerMonth(): Promise<TotalAmountPerMonthDTO[]> {
        // TODO: Join queries into one async
        const outcomes = (await this.transferService.getLimitedTotalMonthlyAmount(1, TransferType.Outcome)).map((outcome) => {
            return {
                year: outcome.year,
                month: outcome.month - 1,
                amount: parseFloat(outcome.amount),
                transactionsCount: outcome.count,
            };
        });
        const incomes = (await this.transferService.getLimitedTotalMonthlyAmount(1, TransferType.Income)).map((income) => {
            return {
                year: income.year,
                month: income.month - 1,
                amount: parseFloat(income.amount),
                transactionsCount: income.count,
            };
        });

        const today = new Date();
        let year = today.getFullYear();
        let month = today.getMonth();

        for (let i = 0; i < 12; i++) {
            if (!outcomes.find((o) => o.year === year && o.month === month)) {
                outcomes.push({
                    year: year,
                    month: month,
                    amount: 0,
                    transactionsCount: 0,
                });
            }
            month--;
            if (month < 0) {
                year--;
                month = 11;
            }
        }
        return outcomes
            .sort((a, b) => new Date(b.year, b.month).getTime() - new Date(a.year, a.month).getTime())
            .slice(0, 12)
            .map((o) => {
                return {
                    ...o,
                    outcomes: o.amount,
                    incomes: incomes.find((i) => i.year === o.year && i.month === o.month)?.amount ?? 0,
                };
            });
    }

    @Post('save')
    async saveTransferObject(@Body() transfer: SaveTransferDTO): Promise<BaseResponseDTO> {
        console.log(transfer);
        console.log(transfer.date);
        let entity: Transfer;
        const category = await this.categoryService.getById(parseInt(transfer.categoryId?.toString()));
        if (transfer.id) {
            entity = await this.transferService.getById(transfer.id);
        } else {
            entity = new Transfer();
        }
        entity.description = transfer.description;
        entity.amount = transfer.amount.toString();
        entity.date = transfer.date;
        entity.accountId = 1;
        entity.createdDate = new Date();
        if (category) {
            entity.category = category;
            entity.type = category.type;
        } else {
            throw new Error(`Cannot find category ${transfer.categoryId}`);
        }
        entity.contractor = transfer.contractorId ? await this.contractorService.getById(parseInt(transfer.contractorId?.toString())) : undefined;
        if (entity.category.name === 'Paliwo') {
            try {
                entity.metadata = { unitPrice: parseFloat(entity.description.split(' ')[1].replace(',', '.')), location: entity.description.split(' ')[3] };
            } catch (e) {
                console.log('Could not set metadata for transfer on', entity.date);
                console.log(e);
            }
        }
        const inserted = await this.transferService.save(entity);
        console.log(inserted);
        return { insertedId: inserted.id };
    }

    @Post('split')
    async splitTransferObject(@Body() transfer: SplitTransferDTO): Promise<BaseResponseDTO> {
        const category = await this.categoryService.getById(parseInt(transfer.categoryId?.toString()));
        const id = parseInt(transfer.id?.toString());
        const target = await this.transferService.getById(id);
        target.amount = (parseFloat(target.amount) - transfer.amount).toString();
        const entity = new Transfer();
        entity.description = transfer.description;
        entity.amount = transfer.amount.toString();
        if (parseFloat(target.amount) <= 0) {
            throw new Error('Amount too high!');
        }
        entity.date = target.date;
        entity.accountId = target.accountId;
        entity.createdDate = new Date();
        if (category) {
            entity.category = category;
            entity.type = category.type;
        } else {
            throw new Error(`Cannot find category ${transfer.categoryId}`);
        }
        entity.contractor = target.contractor;
        const inserted = await this.transferService.insert(entity);
        await this.transferService.save(target);
        return { insertedId: inserted.identifiers[0].id };
    }

    @Delete(':id')
    async removeTransferObject(@Param('id') id: number) {
        return (await this.transferService.deleteById(id)).affected == 1;
    }
}
