import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoPaginationComponent } from './auto-pagination.component';

describe('AutoPaginationComponent', () => {
    let component: AutoPaginationComponent;
    let fixture: ComponentFixture<AutoPaginationComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AutoPaginationComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AutoPaginationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
