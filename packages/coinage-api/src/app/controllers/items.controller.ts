import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';

import { parseUnit } from '@app/common-units';
import {
    AdvancedItemContainer,
    BaseResponseDTO,
    CreateEditItemDTO,
    DEFAULT_ITEM_KIND,
    ItemContainer,
    ItemDetailsDTO,
    ItemKindDTO,
    ItemWithContainerDTO,
    ItemWithLastUsedPriceDTO,
    TransferWithItemDetailsDTO,
    uniqueTags,
} from '@app/interfaces';

import { ItemDao } from '../daos/item.dao';
import { TagDao } from '../daos/tag.dao';
import { TransferItemDao } from '../daos/transferItem.dao';
import { Item } from '../entities/Item.entity';
import { TransferItem } from '../entities/TransferItem.entity';
import { AuthGuard } from '../services/auth.guard';
import { getTransferTags } from '../services/tag-mapper';

@UseGuards(AuthGuard)
@Controller(['item', 'items'])
export class ItemsController {
    public constructor(
        private readonly itemDao: ItemDao,
        private readonly transferItemDao: TransferItemDao,
        private readonly tagDao: TagDao,
    ) {}

    @Get('/all')
    public async getAllItems(): Promise<ItemWithLastUsedPriceDTO[]> {
        return this.itemDao.getAllWithLastUsedPrice();
    }

    @Get('/kinds')
    public getItemKinds(): Promise<ItemKindDTO[]> {
        return this.itemDao.getKinds();
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
            const contents = transferItem.packaging?.contents ?? transferItem.packaging ?? container;
            const transfer = await transferItem.transfer;

            // Create unique key for item + container combination
            const key = `${item?.id || 0}-${transferItem.packagingId ? 'packaging-' + transferItem.packagingId : transferItem.containerId || 'no-container'}`;

            const existing = itemContainerMap.get(key);
            const itemData: ItemWithContainerDTO = existing || {
                id: item?.id || 0,
                name: item?.name || '',
                kindCode: item?.kindCode ?? DEFAULT_ITEM_KIND,
                brand: item?.brand || null,
                categoryId: category?.id || 0,
                categoryName: category?.name || null,
                tags: uniqueTags(item?.tags),
                // Deprecated fields marked
                containerSize: item?.containerSize || null,
                containerSizeUnit: item?.containerSizeUnit || null,
                // Container entity information
                containerId: container?.id || null,
                packagingId: transferItem.packagingId ?? null,
                containerName: transferItem.packaging?.name ?? container?.name ?? null,
                containerWeight: contents?.weight ?? null,
                containerWeightUnit: parseUnit(contents?.weightUnit ?? null) ?? null,
                containerVolume: contents?.volume ?? null,
                containerVolumeUnit: parseUnit(contents?.volumeUnit ?? null) ?? null,
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

        // Include unused catalog items too, so their tags can be found and edited.
        const usedItemIds = new Set([...itemContainerMap.values()].map((item) => item.id));
        for (const item of await this.itemDao.getAll()) {
            if (usedItemIds.has(item.id)) continue;
            const category = await item.category;
            itemContainerMap.set(`${item.id}-no-container`, {
                id: item.id,
                name: item.name,
                kindCode: item.kindCode ?? DEFAULT_ITEM_KIND,
                brand: item.brand,
                categoryId: item.categoryId ?? 0,
                categoryName: category?.name ?? null,
                tags: uniqueTags(item.tags),
                containerSize: item.containerSize,
                containerSizeUnit: item.containerSizeUnit,
                lastUsedDate: null,
                lastUnitPrice: null,
            });
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
    public async getItemById(@Param('itemId', ParseIntPipe) itemId: number): Promise<ItemDetailsDTO> {
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
        // collect transfer-level containers (unique by id)
        const containers = await Promise.all(
            transferItems
                .filter((transferItem) => transferItem.itemId === itemId && (transferItem.containerId != null || transferItem.packagingId != null))
                .map(async (transferItem) => ({
                    id: transferItem.packagingId ?? transferItem.containerId,
                    container: await transferItem.container,
                    name: transferItem.packaging?.name,
                    contents: transferItem.packaging?.contents ?? transferItem.packaging ?? (await transferItem.container),
                })),
        );

        const seen = new Set<number>();
        const itemContainers: AdvancedItemContainer[] = [];
        for (const entry of containers) {
            if (!entry || entry.id == null) continue;
            if (seen.has(entry.id)) continue;
            seen.add(entry.id);
            const container = entry.container;
            const advancedContainer = new AdvancedItemContainer();
            advancedContainer.id = entry.id;
            advancedContainer.name = entry.name ?? container?.name ?? null;
            advancedContainer.weight = entry.contents?.weight ?? undefined;
            advancedContainer.weightUnit = parseUnit(entry.contents?.weightUnit ?? null) ?? undefined;
            advancedContainer.volume = entry.contents?.volume ?? undefined;
            advancedContainer.volumeUnit = parseUnit(entry.contents?.volumeUnit ?? null) ?? undefined;
            advancedContainer.itemCount = entry.contents?.itemCount ?? null;
            itemContainers.push(advancedContainer);
        }

        return {
            id: item.id,
            brand: item.brand,
            itemName: item.name,
            kindCode: item.kindCode ?? DEFAULT_ITEM_KIND,
            categoryId: category?.id ?? null,
            categoryName: category?.name ?? null,
            tags: uniqueTags(item.tags),
            isArchived: item.isArchived,
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
        const kindCode = item.kindCode ?? entity.kindCode ?? DEFAULT_ITEM_KIND;
        if (item.kindCode !== undefined && !(await this.itemDao.kindExists(kindCode))) {
            throw new BadRequestException('Unknown item kind.');
        }
        entity.kindCode = kindCode;
        entity.categoryId = item.categoryId;
        entity.containerSize = item.containerSize;
        entity.containerSizeUnit = item.containerSizeUnit;
        if (typeof item.isArchived === 'boolean') {
            entity.isArchived = item.isArchived;
        }
        if (item.tagIds !== undefined) {
            entity.tags = await this.tagDao.getByIds(item.tagIds);
        }

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
        let containerItemCount: number | null = null;

        if (transferItem.containerId != null || transferItem.packagingId != null) {
            const container = await transferItem.container;
            const contents = transferItem.packaging?.contents ?? transferItem.packaging ?? container;
            if (contents) {
                containerName = transferItem.packaging?.name ?? container?.name ?? null;
                containerWeight = contents.weight ?? null;
                containerWeightUnit = parseUnit(contents.weightUnit ?? null) ?? null;
                containerVolume = contents.volume ?? null;
                containerVolumeUnit = parseUnit(contents.volumeUnit ?? null) ?? null;
                containerItemCount = contents.itemCount ?? null;
            }
        }
        return {
            transferId: transfer.id,
            transferItemId: transferItem.id,
            packagingId: transferItem.packagingId ?? null,
            transferName: transfer.description,
            tags: getTransferTags(transfer),
            transferContractorId: transfer.contractor?.id ?? null,
            transferContractorName: transfer.contractor?.name ?? null,
            originAccountId: transfer.originAccountId,
            originAccountName: transfer.originAccount.name,
            date: transfer.date,
            receiptId: transfer.receiptId ?? null,
            quantity: transferItem.quantity,
            unitPrice: transferItem.unitPrice,
            totalPrice: transferItem.totalSetPrice,
            setDiscount: transferItem.totalSetDiscount,
            containerName: containerName,
            containerWeight: containerWeight,
            containerWeightUnit: containerWeightUnit,
            containerVolume: containerVolume,
            containerVolumeUnit: containerVolumeUnit,
            containerItemCount: containerItemCount,
        };
    }
}
