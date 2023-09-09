import { TestBed } from '@angular/core/testing';

import { CoinageStorageService } from './coinage-storage.service';

describe('CoinageLocalStorageService', () => {
    let service: CoinageStorageService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(CoinageStorageService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
