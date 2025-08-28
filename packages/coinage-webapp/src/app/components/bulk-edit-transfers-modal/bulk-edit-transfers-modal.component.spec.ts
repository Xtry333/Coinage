import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BulkEditTransfersModalComponent } from './bulk-edit-transfers-modal.component';

describe('BulkEditTransfersModalComponent', () => {
    let component: BulkEditTransfersModalComponent;
    let fixture: ComponentFixture<BulkEditTransfersModalComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [BulkEditTransfersModalComponent],
        });
        fixture = TestBed.createComponent(BulkEditTransfersModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
