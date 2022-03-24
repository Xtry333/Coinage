import { Injectable } from '@nestjs/common';
import { Transfer } from '../entities/Transfer.entity';
import { TransferDao } from '../daos/transfer.dao';

@Injectable()
export class EtherealTransferService {
    constructor(private readonly transferDao: TransferDao) {}

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
}
