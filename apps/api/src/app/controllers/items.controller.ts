import { ItemDTO } from '@coinage-app/interfaces';
import { Controller, Get } from '@nestjs/common';

import { ItemDao } from '../daos/item.dao';

@Controller('items')
export class ItemsController {
    public constructor(private readonly itemDao: ItemDao) {}

    @Get('/all')
    public async getAllItems(): Promise<ItemDTO[]> {
        return this.itemDao.getAll();
    }
}
