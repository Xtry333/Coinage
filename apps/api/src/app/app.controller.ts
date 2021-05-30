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
}
