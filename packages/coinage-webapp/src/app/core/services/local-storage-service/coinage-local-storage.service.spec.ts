import { TestBed } from '@angular/core/testing';

import { CoinageLocalStorageService } from './coinage-local-storage.service';

describe('CoinageLocalStorageService', () => {
    let service: CoinageLocalStorageService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(CoinageLocalStorageService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
