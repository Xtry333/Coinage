import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service';
import { TransferDTO } from '@coinage-app/interfaces';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    async getData(): Promise<TransferDTO[]> {
        return (await this.appService.getTransfers()).map((t) => {
            return {
                id: t.id,
                description: t.description,
                contractor: t.contractor?.name,
                amount: parseFloat(t.amount),
                category: t.category?.name,
                date: t.date,
            } as TransferDTO;
        });
    }
}
