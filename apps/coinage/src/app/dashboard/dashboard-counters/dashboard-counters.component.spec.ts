import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardCountersComponent } from './dashboard-counters.component';

describe('DashboardCountersComponent', () => {
    let component: DashboardCountersComponent;
    let fixture: ComponentFixture<DashboardCountersComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DashboardCountersComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DashboardCountersComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
