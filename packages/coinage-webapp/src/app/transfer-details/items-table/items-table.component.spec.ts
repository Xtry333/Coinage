import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransferItemDTO } from '@app/interfaces';

import { ItemsTableComponent } from './items-table.component';

describe('ItemsTableComponent', () => {
    let component: ItemsTableComponent;
    let fixture: ComponentFixture<ItemsTableComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ItemsTableComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ItemsTableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('tracks separate purchased sizes of the same product without duplicate row keys', () => {
        component.items = [
            { id: 10, transferItemId: 100, packagingId: 3, amount: 1, totalPrice: 5, setDiscount: 0 },
            { id: 10, transferItemId: 101, packagingId: 4, amount: 1, totalPrice: 5, setDiscount: 0 },
        ] as TransferItemDTO[];
        component.ngOnChanges();
        expect(component.tableItems.map((item, index) => component.idTracker(index, item))).toEqual(['100', '101']);
    });
});
