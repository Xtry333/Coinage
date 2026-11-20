import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CoinageDataService } from './coinage.data-service';

describe('CoinageDataService', () => {
    let service: CoinageDataService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [],
        });
        service = TestBed.inject(CoinageDataService);
    });

    afterEach(() => TestBed.inject(HttpTestingController).verify());

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it.each([false, true])('updates an existing shared container with explicit correction consent: %p', async (correctMatchingPackaging) => {
        const pending = service.updateSharedContainer(
            { id: 7, name: 'Can', weight: null, weightUnit: null, volume: 350, volumeUnit: 'ml', itemCount: 1 },
            correctMatchingPackaging,
            true,
        );
        const request = TestBed.inject(HttpTestingController).expectOne('/api/containers/7');
        expect(request.request.method).toBe('PUT');
        expect(request.request.body).toEqual({
            name: 'Can',
            weight: null,
            weightUnit: null,
            volume: 350,
            volumeUnit: 'ml',
            itemCount: 1,
            correctMatchingPackaging,
            acknowledgeHistoricalImpact: true,
        });
        request.flush({ insertedId: 7 });
        expect(await pending).toEqual({ insertedId: 7 });
    });
});
