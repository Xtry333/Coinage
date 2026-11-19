import { Body, ConflictException, Controller, Delete, ForbiddenException, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

import { AssignTagDTO, BaseResponseDTO, CreateEditTagDTO, SetTagIdsDTO, uniqueTags } from '@app/interfaces';

import { ItemDao } from '../daos/item.dao';
import { TagDao } from '../daos/tag.dao';
import { TransferDao } from '../daos/transfer.dao';
import { Tag } from '../entities/Tag.entity';
import { AuthGuard, RequestingUser } from '../services/auth.guard';

@UseGuards(AuthGuard)
@Controller('tags')
export class TagsController {
    public constructor(
        private readonly tagDao: TagDao,
        private readonly itemDao: ItemDao,
        private readonly transferDao: TransferDao,
    ) {}

    @Get()
    public async getAllTags() {
        const tags = await this.tagDao.getAll();
        return uniqueTags(tags);
    }

    @Get(':id')
    public async getTagById(@Param('id', ParseIntPipe) id: number) {
        const tag = await this.tagDao.getById(id);
        return {
            id: tag.id,
            name: tag.name,
            color: tag.color,
        };
    }

    @Post()
    public async createOrUpdateTag(@Body() body: CreateEditTagDTO): Promise<BaseResponseDTO> {
        const tag = body.id ? await this.tagDao.getById(body.id) : new Tag();
        tag.name = body.name;
        tag.color = body.color ?? null;
        try {
            const saved = await this.tagDao.save(tag);
            return { insertedId: saved.id };
        } catch (error) {
            if (error instanceof QueryFailedError && error.driverError.code === '23505') {
                throw new ConflictException('A tag with this name already exists.');
            }
            throw error;
        }
    }

    @Post('items/:itemId')
    public async setItemTags(@Param('itemId', ParseIntPipe) itemId: number, @Body() body: SetTagIdsDTO): Promise<BaseResponseDTO> {
        const item = await this.itemDao.getById(itemId);
        item.tags = await this.tagDao.getByIds(body.tagIds);
        await this.itemDao.save(item);
        return { insertedId: item.id };
    }

    @Post('transfers/:transferId')
    public async setTransferTags(
        @RequestingUser('id') userId: number,
        @Param('transferId', ParseIntPipe) transferId: number,
        @Body() body: SetTagIdsDTO,
    ): Promise<BaseResponseDTO> {
        const transfer = await this.transferDao.getById(transferId);
        if (transfer.ownerUserId !== userId && transfer.originAccount.userId !== userId && transfer.targetAccount?.userId !== userId) {
            throw new ForbiddenException('Transfer is not owned by user.');
        }
        transfer.tags = await this.tagDao.getByIds(body.tagIds);
        await this.transferDao.setTags(transfer.id, transfer.tags);
        return { insertedId: transfer.id };
    }

    @Post(':itemId/assign')
    public async assignTagToItem(@Param('itemId', ParseIntPipe) itemId: number, @Body() body: AssignTagDTO): Promise<BaseResponseDTO> {
        const item = await this.itemDao.getById(itemId);
        const tag = await this.tagDao.getById(body.tagId);

        const ids = new Set((item.tags ?? []).map((assigned) => assigned.id));
        if (!ids.has(tag.id)) {
            item.tags = [...(item.tags ?? []), tag];
            await this.itemDao.save(item);
        }

        return { message: `Tag "${tag.name}" assigned to item "${item.name}".` };
    }

    @Post(':itemId/unassign')
    public async unassignTagFromItem(@Param('itemId', ParseIntPipe) itemId: number, @Body() body: AssignTagDTO): Promise<BaseResponseDTO> {
        const item = await this.itemDao.getById(itemId);

        if (item.tags) {
            item.tags = item.tags.filter((t) => t.id !== body.tagId);
            await this.itemDao.save(item);
        }

        return { message: `Tag removed from item "${item.name}".` };
    }

    @Delete(':id')
    public async deleteTag(@Param('id', ParseIntPipe) id: number): Promise<BaseResponseDTO> {
        await this.tagDao.deleteById(id);
        return { message: 'Tag deleted.' };
    }
}
