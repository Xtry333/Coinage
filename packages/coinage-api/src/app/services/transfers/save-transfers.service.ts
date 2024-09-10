import { CategoryDao } from '../../daos/category.dao';
import { Injectable } from '@nestjs/common';
import { TransferDao } from '../../daos/transfer.dao';

@Injectable()
export class SaveTransfersService {
    constructor(
        private readonly transferDao: TransferDao,
        private readonly categoryDao: CategoryDao,
    ) {}
}
