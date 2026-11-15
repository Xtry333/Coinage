import { Injectable } from '@nestjs/common';

import { AccountDao } from '../daos/account.dao';
import { TransferDao } from '../daos/transfer.dao';
import { Transfer } from '../entities/Transfer.entity';

@Injectable()
export class EtherealTransferService {
    public constructor(
        private readonly transferDao: TransferDao,
        private readonly accountDao: AccountDao,
    ) {}

    public async stage(id: number): Promise<Transfer> {
        const target = await this.transferDao.getById(id);
        target.isEthereal = true;
        this.transferDao.save(target);
        return target;
    }

    public async commit(id: number): Promise<Transfer> {
        const target = await this.transferDao.getById(id);
        target.isEthereal = false;
        this.transferDao.save(target);
        return target;
    }

    public cleanup(): Promise<number> {
        return this.transferDao.deleteEthereals();
    }

    public async cleanupUser(id: number): Promise<number> {
        const accounts = await this.accountDao.getCurrentlyActiveForUserId(id);
        return this.transferDao.deleteEthereals();
    }
}
