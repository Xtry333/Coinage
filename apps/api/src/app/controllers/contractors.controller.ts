import { ContractorDTO } from '@coinage-app/interfaces';
import { Controller, Get } from '@nestjs/common';

import { ContractorService } from '../services/contractor.service';

@Controller('contractor')
export class ContractorController {
    constructor(private readonly contractorService: ContractorService) {}

    @Get('/list')
    async getCategoryList(): Promise<ContractorDTO[]> {
        return (await this.contractorService.getAll()).map((c) => {
            return {
                id: c.id,
                name: c.name,
            };
        });
    }
}
