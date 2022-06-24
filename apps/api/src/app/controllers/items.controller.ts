import { BaseResponseDTO, CreateEditItemDTO, ItemWithLastUsedPriceDTO } from '@coinage-app/interfaces';
import { Body, Controller, Get, Post } from '@nestjs/common';

import { ItemDao } from '../daos/item.dao';
import { Item } from '../entities/Item.entity';

@Controller('item(s)?')
export class ItemsController {
    public constructor(private readonly itemDao: ItemDao) {}

    @Get('/all')
    public async getAllItems(): Promise<ItemWithLastUsedPriceDTO[]> {
        return this.itemDao.getAllWithLastUsedPrice();
    }

    @Post('/save')
    public async saveItem(@Body() item: CreateEditItemDTO): Promise<BaseResponseDTO> {
        const entity: Item = item.id !== null ? await this.itemDao.getById(item.id) : new Item();

        entity.brand = item.brand;
        entity.name = item.name;
        entity.categoryId = item.categoryId;
        entity.containerSize = item.containerSize;
        entity.containerSizeUnit = item.containerSizeUnit;

        const inserted = await this.itemDao.save(entity);

        return { insertedId: inserted.id };
    }
}
