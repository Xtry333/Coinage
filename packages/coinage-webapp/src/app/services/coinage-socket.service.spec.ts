import { TestBed } from '@angular/core/testing';

import { CoinageSocketService } from './coinage-socket.service';

describe('CoinageSocketService', () => {
    let service: CoinageSocketService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(CoinageSocketService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
