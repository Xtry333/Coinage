import {
    BaseResponseDTO,
    CreateEditItemDTO,
    ItemContainer,
    ItemDetailsDTO,
    ItemWithLastUsedPriceDTO,
    TransferWithItemDetailsDTO,
} from '@coinage-app/interfaces';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { ItemDao } from '../daos/item.dao';
import { TransferItemDao } from '../daos/transferItem.dao';
import { Item } from '../entities/Item.entity';
import { TransferItem } from '../entities/TransferItem.entity';

@Controller('item(s)?')
export class ItemsController {
    public constructor(private readonly itemDao: ItemDao, private readonly transferItemDao: TransferItemDao) {}

    @Get('/all')
    public async getAllItems(): Promise<ItemWithLastUsedPriceDTO[]> {
        return this.itemDao.getAllWithLastUsedPrice();
    }

    @Get('/:itemId')
    public async getItemById(@Param('itemId') itemId: number): Promise<ItemDetailsDTO> {
        const item = await this.itemDao.getById(itemId),
            category = await item.category,
            container = item.containerSizeUnit ? new ItemContainer() : null;

        if (container && item.containerSizeUnit) {
            container.size = item.containerSize ?? undefined;
            container.unit = item.containerSizeUnit;
        }

        const transferItems = await this.transferItemDao.findByItemId(itemId);
        const transfersWithItems = await Promise.all(transferItems.map(async (transferItem) => this.toTransfersWithItemsDTO(transferItem)));

        return {
            id: item.id,
            brand: item.brand,
            itemName: item.name,
            categoryId: category?.id ?? null,
            categoryName: category?.name ?? null,
            container: container,
            createdDate: item.createdDate,
            editedDate: item.editedDate,
            transfersWithItems: transfersWithItems,
        };
    }

    @Post('/save')
    public async saveItem(@Body() item: CreateEditItemDTO): Promise<BaseResponseDTO> {
        console.log(item);
        const entity: Item = item.id !== null ? await this.itemDao.getById(item.id) : new Item();

        entity.brand = item.brand;
        entity.name = item.name;
        entity.categoryId = item.categoryId;
        entity.containerSize = item.containerSize;
        entity.containerSizeUnit = item.containerSizeUnit;

        const inserted = await this.itemDao.save(entity);

        return { insertedId: inserted.id };
    }

    private async toTransfersWithItemsDTO(transferItem: TransferItem): Promise<TransferWithItemDetailsDTO> {
        const transfer = await transferItem.transfer;
        return {
            transferId: transfer.id,
            transferName: transfer.description,
            // amount: transfer.amount,
            // type: transfer.type,
            // categoryId: transfer.category?.id,
            // categoryName: transfer.category?.name,
            transferContractorId: transfer.contractor?.id ?? null,
            transferContractorName: transfer.contractor?.name ?? null,
            accountId: transfer.originAccountId,
            accountName: transfer.originAccount.name,
            date: transfer.date,
            receiptId: transfer.receiptId ?? null,
            quantity: transferItem.quantity,
            unitPrice: transferItem.unitPrice,
        };
    }
}
