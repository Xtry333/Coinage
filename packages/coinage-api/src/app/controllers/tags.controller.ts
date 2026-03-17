import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';

import { BaseResponseDTO } from '@app/interfaces';

import { ItemDao } from '../daos/item.dao';
import { TagDao } from '../daos/tag.dao';
import { Tag } from '../entities/Tag.entity';
import { AuthGuard } from '../services/auth.guard';

@UseGuards(AuthGuard)
@Controller('tags')
export class TagsController {
    public constructor(
        private readonly tagDao: TagDao,
        private readonly itemDao: ItemDao,
    ) {}

    @Get()
    public async getAllTags() {
        const tags = await this.tagDao.getAll();
        return tags.map((tag) => ({
            id: tag.id,
            name: tag.name,
            color: tag.color,
        }));
    }

    @Get(':id')
    public async getTagById(@Param('id') id: number) {
        const tag = await this.tagDao.getById(id);
        return {
            id: tag.id,
            name: tag.name,
            color: tag.color,
        };
    }

    @Post()
    public async createOrUpdateTag(@Body() body: { id?: number; name: string; color?: string }): Promise<BaseResponseDTO> {
        const tag = body.id ? await this.tagDao.getById(body.id) : new Tag();
        tag.name = body.name;
        tag.color = body.color ?? null;
        const saved = await this.tagDao.save(tag);
        return { insertedId: saved.id };
    }

    @Post(':itemId/assign')
    public async assignTagToItem(@Param('itemId') itemId: number, @Body() body: { tagId: number }): Promise<BaseResponseDTO> {
        const item = await this.itemDao.getById(itemId);
        const tag = await this.tagDao.getById(body.tagId);

        if (!item.tags) {
            item.tags = [];
        }

        if (!item.tags.find((t) => t.id === tag.id)) {
            item.tags.push(tag);
            await this.itemDao.save(item);
        }

        return { message: `Tag "${tag.name}" assigned to item "${item.name}".` };
    }

    @Post(':itemId/unassign')
    public async unassignTagFromItem(@Param('itemId') itemId: number, @Body() body: { tagId: number }): Promise<BaseResponseDTO> {
        const item = await this.itemDao.getById(itemId);

        if (item.tags) {
            item.tags = item.tags.filter((t) => t.id !== body.tagId);
            await this.itemDao.save(item);
        }

        return { message: `Tag removed from item "${item.name}".` };
    }

    @Delete(':id')
    public async deleteTag(@Param('id') id: number): Promise<BaseResponseDTO> {
        await this.tagDao.deleteById(id);
        return { message: 'Tag deleted.' };
    }
}
