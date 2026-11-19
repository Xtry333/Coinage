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
        component.filters = [
            { key: 'categoryIds', label: 'Category', value: 'Groceries, Transport' },
            { key: 'showFlagged', label: 'Only flagged transfers' },
        ];
        fixture.detectChanges();

        const filters: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('li'));
        expect(filters.map((filter) => filter.textContent?.trim())).toEqual(['Category: Groceries, Transport', 'Only flagged transfers']);
    });

    it('emits a clear-all event from a link-style button', () => {
        component.filters = [{ key: 'description', label: 'Description', value: 'Lunch' }];
        const clearAll = jest.spyOn(component.clearAll, 'emit');
        fixture.detectChanges();

        const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[aria-label="Clear all filters"]');
        button.click();

        expect(button.type).toBe('button');
        expect(button.classList.contains('underline')).toBe(true);
        expect(clearAll).toHaveBeenCalledTimes(1);
    });

    it('emits only the clicked filter key without clearing all filters', () => {
        component.filters = [
            { key: 'tagIds', label: 'Tags (any)', value: 'Electronics' },
            { key: 'excludedTagIds', label: 'Tags (none)', value: 'Groceries' },
        ];
        const remove = jest.spyOn(component.remove, 'emit');
        const clearAll = jest.spyOn(component.clearAll, 'emit');
        fixture.detectChanges();

        const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('li button'));
        expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
            'Remove Tags (any) filter: Electronics',
            'Remove Tags (none) filter: Groceries',
        ]);
        expect(buttons.every((button) => button.type === 'button' && button.classList.contains('cursor-pointer'))).toBe(true);
        expect(buttons[1].querySelector('svg')?.classList.contains('group-hover:opacity-100')).toBe(true);
        expect(buttons[1].querySelector('svg')?.classList.contains('group-focus-visible:opacity-100')).toBe(true);
        buttons[1].click();

        expect(remove).toHaveBeenCalledTimes(1);
        expect(remove).toHaveBeenCalledWith('excludedTagIds');
        expect(clearAll).not.toHaveBeenCalled();
        expect(component.filters).toHaveLength(2);
    });
});
