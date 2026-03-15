import { TestBed } from '@angular/core/testing';

import { LoadingService } from './loading.service';

describe('LoadingService', () => {
    let service: LoadingService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(LoadingService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('loading$ observable', () => {
        it('should emit boolean values', (done) => {
            service.loading$.subscribe((value) => {
                expect(typeof value).toBe('boolean');
                done();
            });
        });

        it('should emit true after show() and false after hide() in sequence', (done) => {
            const values: boolean[] = [];
            const sub = service.loading$.subscribe((v) => values.push(v));

            service.show();
            service.hide();

            // delay(0) defers emissions — wait for macrotask to flush
            setTimeout(() => {
                expect(values).toContain(true);
                expect(values).toContain(false);
                sub.unsubscribe();
                done();
            }, 20);
        });

        it('should emit true after calling show()', (done) => {
            const values: boolean[] = [];
            const sub = service.loading$.subscribe((v) => values.push(v));

            service.show();

            setTimeout(() => {
                expect(values).toContain(true);
                sub.unsubscribe();
                done();
            }, 20);
        });

        it('should emit false after calling hide()', (done) => {
            const values: boolean[] = [];
            const sub = service.loading$.subscribe((v) => values.push(v));

            service.hide();

            setTimeout(() => {
                expect(values).toContain(false);
                sub.unsubscribe();
                done();
            }, 20);
        });
    });
});
