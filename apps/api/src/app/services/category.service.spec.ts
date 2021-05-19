import { TestBed } from '@angular/core/testing';

import { TransferService } from './transfer.service';

describe('TransferService', () => {
    let service: TransferService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TransferService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return by id', async () => {
        const transfer = await service.getById(1);
        expect(transfer).toBeDefined();
    });
});
