import { Body, Controller, Delete, Get, Next, Param, Post } from '@nestjs/common';

import { SaveTransferDTO, SplitTransferDTO, TotalOutcomesPerMonthDTO, TransferDetailsDTO, TransferDTO } from '@coinage-app/interfaces';
import { TransferService } from '../services/transfer.service';
import { Category } from '../entity/Category.entity';
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
                category: t.category?.name,
                date: t.date,
            } as TransferDTO;
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

        const otherTransfers: TransferDTO[] = (await this.appService.getTransferByDateContractor(transfer.date, transfer.contractor?.id ?? 0))
            .filter((t) => t.id !== transfer.id)
            .map((t) => {
                return {
                    id: t.id,
                    description: t.description,
                    amount: parseFloat(t.amount),
                    category: t.category.name,
                    date: t.date,
                    categoryId: t.category.id,
                };
            });

        console.log(transfer);

        return {
            id: transfer.id,
            description: transfer.description,
            amount: parseFloat(transfer.amount),
            createdDate: transfer.createdDate,
            editedDate: transfer.editedDate,
            contractor: transfer.contractor?.name,
            contractorId: transfer.contractor?.id,
            categoryId: transfer.category.id,
            otherTransfers: otherTransfers,
            date: transfer.date,
            categoryPath: categoryPath.reverse().map((cat) => {
                return { id: cat.id, name: cat.name };
            }),
        };
    }

    @Get('/totalOutcomesPerMonth')
    async getLastTotalOutcomesPerMonth(): Promise<TotalOutcomesPerMonthDTO[]> {
        const outcomes: TotalOutcomesPerMonthDTO[] = (await this.transferService.getLimitedTotalOutcomes()).map((outcome) => {
            return {
                year: outcome.year,
                month: outcome.month - 1,
                amount: parseFloat(outcome.amount),
                transactionsCount: outcome.count,
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
        return outcomes.sort((a, b) => new Date(b.year, b.month).getTime() - new Date(a.year, a.month).getTime()).slice(0, 12);
    }

    @Post('save')
    async saveTransferObject(@Body() transfer: SaveTransferDTO): Promise<{ insertedId: number }> {
        console.log(transfer);
        console.log(transfer.date);
        let entity: Transfer;
        if (transfer.id) {
            entity = await this.transferService.getById(transfer.id);
        } else {
            entity = new Transfer();
        }
        entity.description = transfer.description;
        entity.amount = transfer.amount.toString();
        entity.date = transfer.date;
        entity.createdDate = new Date();
        entity.category = await this.categoryService.getById(parseInt(transfer.categoryId?.toString()));
        entity.contractor = transfer.contractorId ? await this.contractorService.getById(parseInt(transfer.contractorId?.toString())) : undefined;
        console.log(entity);
        const inserted = await this.transferService.save(entity);
        console.log(inserted);
        return { insertedId: inserted.id };
    }

    @Post('split')
    async splitTransferObject(@Body() transfer: SplitTransferDTO): Promise<{ insertedId: number }> {
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
        entity.user = target.user;
        entity.createdDate = new Date();
        entity.category = await this.categoryService.getById(parseInt(transfer.category?.toString()));
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
