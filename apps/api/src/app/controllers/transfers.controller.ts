import { Body, Controller, Get, Next, Param, Post } from '@nestjs/common';

import { CreateTransferDTO, TotalOutcomesPerMonthDTO, TransferDetailsDTO, TransferDTO } from '@coinage-app/interfaces';
import { TransferService } from '../services/transfer.service';
import { Category } from '../entity/Category.entity';
import { AppService } from '../app.service';
import { CategoryService } from '../services/category.service';
import { Transfer } from '../entity/Transfer.entity';

@Controller('transfer')
export class TransfersController {
    constructor(
        private readonly transferService: TransferService,
        private readonly appService: AppService,
        private readonly categoryService: CategoryService
    ) {}

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

    @Post('create')
    async createTransferObject(@Body() transfer: CreateTransferDTO): Promise<{ insertedId: number }> {
        console.log(transfer);
        console.log(transfer.date);
        const entity = new Transfer();
        entity.description = transfer.description;
        entity.amount = transfer.amount.toString();
        entity.date = transfer.date;
        entity.createdDate = new Date();
        entity.category = await this.categoryService.getById(parseInt(transfer.category?.toString()));
        //entity.contractor = await this.contractorService.getById(parseInt(transfer.contractor?.toString()));
        console.log(entity);
        const inserted = await this.transferService.insert(entity);
        console.log(inserted);
        return { insertedId: inserted.identifiers[0].id };
    }
}
