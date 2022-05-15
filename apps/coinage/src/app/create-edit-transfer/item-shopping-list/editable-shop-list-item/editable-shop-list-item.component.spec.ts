import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditableShopListItemComponent } from './editable-shop-list-item.component';

describe('EditableShopListItemComponent', () => {
    let component: EditableShopListItemComponent;
    let fixture: ComponentFixture<EditableShopListItemComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EditableShopListItemComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EditableShopListItemComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
