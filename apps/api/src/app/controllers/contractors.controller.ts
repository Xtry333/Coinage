import { BaseResponseDTO, ContractorDTO, CreateEditContractorDTO } from '@coinage-app/interfaces';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { Contractor } from '../entity/Contractor.entity';

import { ContractorService } from '../services/contractor.service';

@Controller('contractor')
export class ContractorController {
    constructor(private readonly contractorService: ContractorService) {}

    @Get('/list')
    async getCategoryList(): Promise<ContractorDTO[]> {
        const contractors = (await this.contractorService.getAll()).map((c) => {
            return {
                id: c.id,
                name: c.name,
            };
        });
        //contractors.unshift({ id: 0, name: '' });
        return contractors.sort((a, b) => a.name.localeCompare(b.name));
    }

    @Post('save')
    async saveContractor(@Body() contractor: CreateEditContractorDTO): Promise<BaseResponseDTO> {
        let entity: Contractor;

        if (contractor.id) {
            const result = await this.contractorService.getById(contractor.id);
            if (result) {
                entity = result;
            } else {
                throw new Error('Id not found.');
            }
        } else {
            entity = new Contractor();
        }

        entity.name = contractor.name;

        const inserted = await this.contractorService.save(entity);

        return { insertedId: inserted.id };
    }
}
