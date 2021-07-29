import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CoinageDataService } from './coinageData.service';

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
