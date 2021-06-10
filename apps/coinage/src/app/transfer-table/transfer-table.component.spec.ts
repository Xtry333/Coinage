import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransferTableComponent } from './transfer-table.component';

describe('TransferTableComponent', () => {
    let component: TransferTableComponent;
    let fixture: ComponentFixture<TransferTableComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TransferTableComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TransferTableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
