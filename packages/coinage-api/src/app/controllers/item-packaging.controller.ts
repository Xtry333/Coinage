import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';

import { ItemPackagingSaveInput } from '@app/interfaces';

import { AuthGuard } from '../services/auth.guard';
import { ItemPackagingService } from '../services/item-packaging.service';

@UseGuards(AuthGuard)
@Controller('items/:itemId/packaging')
export class ItemPackagingController {
    public constructor(private readonly packaging: ItemPackagingService) {}

    @Get()
    public list(@Param('itemId', ParseIntPipe) itemId: number) {
        return this.packaging.list(itemId);
    }

    @Post()
    public create(@Param('itemId', ParseIntPipe) itemId: number, @Body() input: ItemPackagingSaveInput) {
        return this.packaging.save(itemId, input);
    }

    @Put(':id')
    public replace(@Param('itemId', ParseIntPipe) itemId: number, @Param('id', ParseIntPipe) id: number, @Body() input: ItemPackagingSaveInput) {
        return this.packaging.save(itemId, input, id);
    }

    @Post(':id/prefer')
    public async prefer(@Param('itemId', ParseIntPipe) itemId: number, @Param('id', ParseIntPipe) id: number) {
        await this.packaging.setState(itemId, id, 'prefer');
        return { insertedId: id };
    }

    @Post(':id/archive')
    public async archive(@Param('itemId', ParseIntPipe) itemId: number, @Param('id', ParseIntPipe) id: number) {
        await this.packaging.setState(itemId, id, 'archive');
        return { insertedId: id };
    }
}
