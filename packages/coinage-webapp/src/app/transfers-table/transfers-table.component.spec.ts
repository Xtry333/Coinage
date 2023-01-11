import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransfersTableComponent } from './transfers-table.component';

describe('TransferTableComponent', () => {
    let component: TransfersTableComponent;
    let fixture: ComponentFixture<TransfersTableComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TransfersTableComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TransfersTableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
