import { TestBed } from '@angular/core/testing';

import { WindowService } from './window-service.service';

describe('WindowService', () => {
    let service: WindowService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [WindowService],
        });
        service = TestBed.inject(WindowService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return correct window', () => {
        expect(service.getWindow).toBeDefined();
    });
});
