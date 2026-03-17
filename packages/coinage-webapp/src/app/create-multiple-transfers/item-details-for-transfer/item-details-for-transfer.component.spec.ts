import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddItemsToTransferComponent } from './item-details-for-transfer.component';

describe('AddItemsToTransferComponent', () => {
    let component: AddItemsToTransferComponent;
    let fixture: ComponentFixture<AddItemsToTransferComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddItemsToTransferComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AddItemsToTransferComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
