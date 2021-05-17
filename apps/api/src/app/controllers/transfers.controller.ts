import { Controller, Get } from '@nestjs/common';

import { TotalOutcomesPerMonthDTO } from '@coinage-app/interfaces';
import { TransferService } from '../services/transfer.service';

@Controller()
export class TransfersController {
    constructor(private readonly appService: TransferService) {}

    @Get('/totalOutcomesPerMonth')
    async getLastTotalOutcomesPerMonth(): Promise<TotalOutcomesPerMonthDTO[]> {
        const outcomes: TotalOutcomesPerMonthDTO[] = (await this.appService.getLimitedTotalOutcomes()).map((outcome) => {
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
        return outcomes.sort((a, b) => new Date(b.year, b.month).getTime() - new Date(a.year, a.month).getTime());
    }
}
