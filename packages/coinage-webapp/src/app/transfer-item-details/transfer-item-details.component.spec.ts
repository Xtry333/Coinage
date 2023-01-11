import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransferItemDetailsComponent } from './transfer-item-details.component';

describe('TransferItemDetailsComponent', () => {
    let component: TransferItemDetailsComponent;
    let fixture: ComponentFixture<TransferItemDetailsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TransferItemDetailsComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(TransferItemDetailsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
