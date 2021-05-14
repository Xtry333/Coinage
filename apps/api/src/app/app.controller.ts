import { Controller, Get, Param } from '@nestjs/common';

import { AppService } from './app.service';
import { TransferDTO, TransferDetailsDTO } from '@coinage-app/interfaces';
import { Category } from './entity/Category.entity';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    async getData(): Promise<TransferDTO[]> {
        return (await this.appService.getTransfers()).map((t) => {
            return {
                id: t.id,
                description: t.description,
                amount: parseFloat(t.amount),
                category: t.category?.name,
                date: t.date,
            } as TransferDTO;
        });
    }

    @Get('/transfer/:id')
    async getTransferDetails(
        @Param() params: { id: string }
    ): Promise<TransferDetailsDTO> {
        const id = parseInt(params.id);
        if (!id) {
            throw new Error('Invalid ID provided');
        }
        const transfer = await this.appService.getTransfer(id);
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

        const otherTransfers: TransferDTO[] = (
            await this.appService.getTransferByDateContractor(
                transfer.date,
                transfer.contractor?.id ?? 0
            )
        )
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
}
