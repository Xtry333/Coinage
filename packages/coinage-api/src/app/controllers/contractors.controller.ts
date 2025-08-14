import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { BaseResponseDTO, ContractorDTO, CreateEditContractorDTO } from '@app/interfaces';

import { ContractorDao } from '../daos/contractor.dao';
import { Contractor } from '../entities/Contractor.entity';
import { AuthGuard } from '../services/auth.guard';

@UseGuards(AuthGuard)
@Controller('contractor')
export class ContractorController {
    public constructor(private readonly contractorDao: ContractorDao) {}

    @Get('list')
    public async getCategoryList(): Promise<ContractorDTO[]> {
        const contractors = (await this.contractorDao.getActive()).map((c) => {
            return {
                id: c.id,
                name: c.name,
            };
        });
        //contractors.unshift({ id: 0, name: '' });
        return contractors.sort((a, b) => a.name.localeCompare(b.name));
    }

    @Post('save')
    public async saveContractor(@Body() contractor: CreateEditContractorDTO): Promise<BaseResponseDTO> {
        let entity: Contractor;

        if (contractor.id) {
            const result = await this.contractorDao.getById(contractor.id);
            if (result) {
                entity = result;
            } else {
                throw new Error('Id not found.');
            }
        } else {
            entity = new Contractor();
        }

        entity.name = contractor.name;

        const inserted = await this.contractorDao.save(entity);

        return { insertedId: inserted.id };
    }
}
