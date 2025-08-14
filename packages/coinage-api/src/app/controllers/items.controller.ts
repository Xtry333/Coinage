import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import {
    AdvancedItemContainer,
    BaseResponseDTO,
    CreateEditItemDTO,
    ItemContainer,
    ItemDetailsDTO,
    ItemWithLastUsedPriceDTO,
    TransferWithItemDetailsDTO,
} from '@app/interfaces';

import { ItemDao } from '../daos/item.dao';
import { TransferItemDao } from '../daos/transferItem.dao';
import { Item } from '../entities/Item.entity';
import { TransferItem } from '../entities/TransferItem.entity';

@Controller('item(s)?')
export class ItemsController {
    public constructor(
        private readonly itemDao: ItemDao,
        private readonly transferItemDao: TransferItemDao,
    ) {}

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
        // filter only the unique containers
        const uniqueContainers = new Set(transferItems.map((transferItem) => transferItem.containerId));
        const itemContainers = (
            await Promise.all(transferItems.filter((transferItem) => transferItem.itemId === itemId).map(async (transferItem) => transferItem.container))
        ).map((container) => {
            const advancedContainer = new AdvancedItemContainer();
            advancedContainer.weight = container?.weight ?? undefined;
            advancedContainer.weightUnit = container?.weightUnit ?? undefined;
            advancedContainer.volume = container?.volume ?? undefined;
            advancedContainer.volumeUnit = container?.volumeUnit ?? undefined;
            return advancedContainer;
        });

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
            itemContainers: itemContainers,
        };
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

    private async toTransfersWithItemsDTO(transferItem: TransferItem): Promise<TransferWithItemDetailsDTO> {
        const transfer = await transferItem.transfer;
        if (transferItem.containerId !== null) {
            const container = await transferItem.container;
        }
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
