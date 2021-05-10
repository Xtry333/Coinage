import { Controller, Get, Param } from '@nestjs/common';

import { AppService } from './app.service';
import { TransferDTO } from '@coinage-app/interfaces';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    async getData() {
        return (await this.appService.getTransfers()).map((t) => {
            return {
                id: t.id,
                description: t.description,
                amount: t.amount,
                category: t.category.name,
            } as TransferDTO;
        });
    }

    @Get('/transfer/:id')
    async getTransfer(@Param() params: { id: string }) {
        const id = parseInt(params.id);
        const transfer = await this.appService.getTransfer(id);
        return {
            id: transfer.id,
            description: transfer.description,
            amount: transfer.amount,
            category: transfer.category.name,
        } as TransferDTO;
    }
}
