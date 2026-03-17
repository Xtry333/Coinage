import { TestBed } from '@angular/core/testing';

import { CurrentUserDataService } from './current-user.service';

describe('CurrentUserDataService', () => {
    let service: CurrentUserDataService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(CurrentUserDataService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
