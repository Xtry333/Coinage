import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { parseUnit } from '@app/common-units';
import {
    AdvancedItemContainer,
    BaseResponseDTO,
    CreateEditItemDTO,
    ItemContainer,
    ItemDetailsDTO,
    ItemWithContainerDTO,
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

    @Get('/all/detailed')
    public async getAllItemsWithDetails(): Promise<ItemDetailsDTO[]> {
        const items = await this.itemDao.getAll();
        const detailedItems = await Promise.all(items.map(async (item) => this.getItemById(item.id)));
        return detailedItems;
    }

    @Get('/all/with-containers')
    public async getAllItemsWithContainers(): Promise<ItemWithContainerDTO[]> {
        // Get all transfer items with their containers and item details
        const transferItems = await this.transferItemDao.findAllWithItemAndContainer();
        const itemContainerMap = new Map<string, ItemWithContainerDTO>();

        for (const transferItem of transferItems) {
            const item = await transferItem.item;
            const category = item ? await item.category : null;
            const container = transferItem.containerId ? await transferItem.container : null;
            const transfer = await transferItem.transfer;

            // Create unique key for item + container combination
            const key = `${item?.id || 0}-${transferItem.containerId || 'no-container'}`;

            const existing = itemContainerMap.get(key);
            const itemData: ItemWithContainerDTO = existing || {
                id: item?.id || 0,
                name: item?.name || '',
                brand: item?.brand || null,
                categoryId: category?.id || 0,
                categoryName: category?.name || null,
                // Deprecated fields marked
                containerSize: item?.containerSize || null,
                containerSizeUnit: item?.containerSizeUnit || null,
                // Container entity information
                containerId: container?.id || null,
                containerName: container?.name || null,
                containerWeight: container?.weight || null,
                containerWeightUnit: parseUnit(container?.weightUnit || null) || null,
                containerVolume: container?.volume || null,
                containerVolumeUnit: parseUnit(container?.volumeUnit || null) || null,
                // Initialize with this transfer item's data
                lastUsedDate: transfer.createdDate,
                lastUnitPrice: transferItem.unitPrice,
                lastUnitPriceCurrency: transfer.currency.symbol,
                transferItemId: transferItem.id,
            };

            // Update with most recent data if this transfer item is newer
            if (!existing || (transfer.createdDate && itemData.lastUsedDate && transfer.createdDate > itemData.lastUsedDate)) {
                itemData.lastUsedDate = transfer.createdDate;
                itemData.lastUnitPrice = transferItem.unitPrice;
                itemData.lastUnitPriceCurrency = transfer.currency.symbol;
                itemData.transferItemId = transferItem.id;
            }

            itemContainerMap.set(key, itemData);
        }

        return Array.from(itemContainerMap.values()).sort((a, b) => {
            // Primary sort: by last used date (newest first), null dates go to end
            if (a.lastUsedDate && b.lastUsedDate) {
                return b.lastUsedDate.getTime() - a.lastUsedDate.getTime();
            }
            if (a.lastUsedDate && !b.lastUsedDate) return -1;
            if (!a.lastUsedDate && b.lastUsedDate) return 1;

            // Secondary sort: by item name for items with same or no dates
            return a.name.localeCompare(b.name);
        });
    }

    @Get('/:itemId')
    public async getItemById(@Param('itemId') itemId: number): Promise<ItemDetailsDTO> {
        const item = await this.itemDao.getById(itemId),
            category = await item.category,
            container = item.containerSizeUnit ? new ItemContainer() : null;

        if (container && item.containerSizeUnit) {
            container.size = item.containerSize ?? undefined;
            container.unit = parseUnit(item.containerSizeUnit) ?? null;
        }

        const transferItems = await this.transferItemDao.findByItemId(itemId);
        const transfersWithItems = await Promise.all(transferItems.map(async (transferItem) => this.toTransfersWithItemsDTO(transferItem)));
        // filter only the unique containers
        const uniqueContainers = new Set(transferItems.map((transferItem) => transferItem.containerId));
        // collect transfer-level containers (unique by id)
        const containers = await Promise.all(
            transferItems
                .filter((transferItem) => transferItem.itemId === itemId && transferItem.containerId !== null)
                .map(async (transferItem) => ({ id: transferItem.containerId, container: await transferItem.container })),
        );

        const seen = new Set<number>();
        const itemContainers: AdvancedItemContainer[] = [];
        for (const entry of containers) {
            if (!entry || entry.id === null) continue;
            if (seen.has(entry.id)) continue;
            seen.add(entry.id);
            const container = entry.container;
            const advancedContainer = new AdvancedItemContainer();
            advancedContainer.id = entry.id;
            advancedContainer.name = container?.name ?? null;
            advancedContainer.weight = container?.weight ?? undefined;
            advancedContainer.weightUnit = parseUnit(container?.weightUnit ?? null) ?? undefined;
            advancedContainer.volume = container?.volume ?? undefined;
            advancedContainer.volumeUnit = parseUnit(container?.volumeUnit ?? null) ?? undefined;
            itemContainers.push(advancedContainer);
        }

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
        let containerName: string | null = null;
        let containerWeight: number | null = null;
        let containerWeightUnit: any | null = null;
        let containerVolume: number | null = null;
        let containerVolumeUnit: any | null = null;

        if (transferItem.containerId !== null) {
            const container = await transferItem.container;
            if (container) {
                containerName = container.name ?? null;
                containerWeight = container.weight ?? null;
                containerWeightUnit = parseUnit(container.weightUnit ?? null) ?? null;
                containerVolume = container.volume ?? null;
                containerVolumeUnit = parseUnit(container.volumeUnit ?? null) ?? null;
            }
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
            containerName: containerName,
            containerWeight: containerWeight,
            containerWeightUnit: containerWeightUnit,
            containerVolume: containerVolume,
            containerVolumeUnit: containerVolumeUnit,
        };
    }
}
