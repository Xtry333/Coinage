import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransfersListComponentComponent } from './transfers-list-component.component';

describe('TransfersListComponentComponent', () => {
    let component: TransfersListComponentComponent;
    let fixture: ComponentFixture<TransfersListComponentComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TransfersListComponentComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TransfersListComponentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
