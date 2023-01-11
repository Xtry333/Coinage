import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BigCounterComponent } from './big-counter.component';

describe('BigCounterComponent', () => {
    let component: BigCounterComponent;
    let fixture: ComponentFixture<BigCounterComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [BigCounterComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(BigCounterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
