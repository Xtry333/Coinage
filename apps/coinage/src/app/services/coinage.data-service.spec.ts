import { CoinageDataService } from './coinage.data-service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

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
