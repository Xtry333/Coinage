import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryListItemComponent } from './category-list-item.component';

describe('CategoryListItemComponent', () => {
    let component: CategoryListItemComponent;
    let fixture: ComponentFixture<CategoryListItemComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CategoryListItemComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CategoryListItemComponent);
        component = fixture.componentInstance;
        component.category = { id: 1, name: 'Test Category' } as any;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
