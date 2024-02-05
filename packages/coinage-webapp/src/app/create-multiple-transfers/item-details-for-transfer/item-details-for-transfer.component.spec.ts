import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemShoppingListComponent } from './item-details-for-transfer.component';

describe('ItemShoppingListComponent', () => {
    let component: ItemShoppingListComponent;
    let fixture: ComponentFixture<ItemShoppingListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ItemShoppingListComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ItemShoppingListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
