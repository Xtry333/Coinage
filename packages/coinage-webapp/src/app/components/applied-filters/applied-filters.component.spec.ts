import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppliedFiltersComponent } from './applied-filters.component';

describe('AppliedFiltersComponent', () => {
    let component: AppliedFiltersComponent;
    let fixture: ComponentFixture<AppliedFiltersComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AppliedFiltersComponent],
        }).compileComponents();
        fixture = TestBed.createComponent(AppliedFiltersComponent);
        component = fixture.componentInstance;
    });

    it('hides the summary when no filters are applied', () => {
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('[aria-label="Applied filters"]')).toBeNull();
        expect(fixture.nativeElement.querySelector('button')).toBeNull();
    });

    it('displays filter names, selected values and boolean filters', () => {
        component.filters = [{ label: 'Category', value: 'Groceries, Transport' }, { label: 'Only flagged transfers' }];
        fixture.detectChanges();

        const filters: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('li'));
        expect(filters.map((filter) => filter.textContent?.trim())).toEqual(['Category: Groceries, Transport', 'Only flagged transfers']);
    });

    it('emits a clear-all event from a link-style button', () => {
        component.filters = [{ label: 'Description', value: 'Lunch' }];
        const clearAll = jest.spyOn(component.clearAll, 'emit');
        fixture.detectChanges();

        const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
        button.click();

        expect(button.type).toBe('button');
        expect(button.classList.contains('underline')).toBe(true);
        expect(clearAll).toHaveBeenCalledTimes(1);
    });
});
