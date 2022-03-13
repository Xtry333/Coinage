import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CoinageDataService } from './coinage.dataService';

describe('CoinageDataService', () => {
    let service: CoinageDataService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [],
        });
        service = TestBed.inject(CoinageDataService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
