import { TestBed } from '@angular/core/testing';

import { TransferDao } from './transfer.dao';

describe('TransferDao', () => {
    let dao: TransferDao;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        dao = TestBed.inject(TransferDao);
    });

    it('should be created', () => {
        expect(dao).toBeTruthy();
    });

    it('should return by id', async () => {
        const transfer = await dao.getById(1);
        expect(transfer).toBeDefined();
    });
});
