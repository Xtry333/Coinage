import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransferItemsTableComponent } from './transfer-items-table.component';

describe('TransferTableComponent', () => {
    let component: TransferItemsTableComponent;
    let fixture: ComponentFixture<TransferItemsTableComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TransferItemsTableComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TransferItemsTableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
