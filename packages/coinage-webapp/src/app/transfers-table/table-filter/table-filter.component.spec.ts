import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterOption, FilterType, TableFilterComponent } from './table-filter.component';

describe('TableFilterComponent', () => {
    let component: TableFilterComponent;
    let fixture: ComponentFixture<TableFilterComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TableFilterComponent],
            imports: [CommonModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TableFilterComponent);
        component = fixture.componentInstance;
    });

    async function openCheckboxFilter(
        options: FilterOption[] = [TableFilterComponent.mapToFilterOptions(1, 'Groceries'), TableFilterComponent.mapToFilterOptions(2, 'Transport')],
    ): Promise<void> {
        component.filterName = 'Category';
        component.filterType = FilterType.MultiCheckbox;
        component.filterOptions = options;
        fixture.detectChanges();
        component.onToggleOpenHide();
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function checkboxes(): HTMLInputElement[] {
        return Array.from(fixture.nativeElement.querySelectorAll('input[type="checkbox"]'));
    }

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('renders existing selections as checked when the popup opens', async () => {
        await openCheckboxFilter([TableFilterComponent.mapToFilterOptions(1, 'Groceries', [1]), TableFilterComponent.mapToFilterOptions(2, 'Transport', [1])]);

        expect(checkboxes().map((checkbox) => checkbox.checked)).toEqual([true, false]);
    });

    it('updates the checkbox immediately when an option is selected or deselected', async () => {
        await openCheckboxFilter();
        const [checkbox] = checkboxes();

        checkbox.click();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(checkbox.checked).toBe(true);
        expect(component.filterOptions?.[0].isSelected).toBe(true);
        expect(component.isPopupDisplayed).toBe(true);

        checkbox.click();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(checkbox.checked).toBe(false);
        expect(component.filterOptions?.[0].isSelected).toBe(false);
    });

    it('selects an option when its label is clicked', async () => {
        await openCheckboxFilter();
        const label: HTMLLabelElement = fixture.nativeElement.querySelector('.filter-option label');

        label.click();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(checkboxes()[0].checked).toBe(true);
        expect(component.filterOptions?.[0].isSelected).toBe(true);
    });

    it('keeps applied selections checked after reopening the popup', async () => {
        await openCheckboxFilter();
        const filterEvent = jest.spyOn(component.filterEvent, 'emit');
        checkboxes()[0].click();
        fixture.detectChanges();
        await fixture.whenStable();

        const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        fixture.detectChanges();

        expect(filterEvent).toHaveBeenCalledWith({ filterType: FilterType.MultiCheckbox, name: 'Category', selectedIds: [1] });
        expect(fixture.nativeElement.querySelector('.filter-popup')).toBeNull();

        component.onToggleOpenHide();
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(checkboxes().map((checkbox) => checkbox.checked)).toEqual([true, false]);
    });

    it('checks only visible options and preserves selections hidden by search', async () => {
        await openCheckboxFilter([
            TableFilterComponent.mapToFilterOptions(1, 'Groceries'),
            TableFilterComponent.mapToFilterOptions(2, 'Transport', [2]),
            TableFilterComponent.mapToFilterOptions(3, 'Utilities'),
        ]);

        component.onChangeOptionSearchValue('grocer');
        component.onCheckVisibleOptions();
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(checkboxes().map((checkbox) => checkbox.checked)).toEqual([true]);

        component.onClearOptionsSearchValue();
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(checkboxes().map((checkbox) => checkbox.checked)).toEqual([true, true, false]);
    });

    it('unchecks all options after clearing the filter', async () => {
        await openCheckboxFilter([TableFilterComponent.mapToFilterOptions(1, 'Groceries', [1])]);

        component.onClear();
        fixture.detectChanges();
        component.onToggleOpenHide();
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(checkboxes()[0].checked).toBe(false);
    });

    it('cycles tag checkboxes through neutral, included and excluded, including label clicks', async () => {
        component.allowExclusion = true;
        await openCheckboxFilter();
        const [checkbox] = checkboxes();
        const label: HTMLLabelElement = fixture.nativeElement.querySelector('.filter-option label');

        checkbox.click();
        fixture.detectChanges();
        expect(checkbox.checked).toBe(true);
        expect(checkbox.indeterminate).toBe(false);
        expect(checkbox.getAttribute('aria-label')).toContain('included');

        label.click();
        fixture.detectChanges();
        expect(checkbox.checked).toBe(false);
        expect(checkbox.indeterminate).toBe(true);
        expect(component.filterOptions?.[0].isExcluded).toBe(true);
        expect(label.textContent).toContain('(excluded)');
        expect(checkbox.getAttribute('aria-label')).toContain('excluded');

        checkbox.click();
        fixture.detectChanges();
        expect(checkbox.checked).toBe(false);
        expect(checkbox.indeterminate).toBe(false);
        expect(component.filterOptions?.[0].isExcluded).toBe(false);
        expect(checkbox.getAttribute('aria-label')).toContain('no filter');

        checkbox.click();
        fixture.detectChanges();
        expect(checkbox.checked).toBe(true);
        expect(checkbox.indeterminate).toBe(false);
    });

    it('applies included and excluded IDs separately and restores both states after reopening', async () => {
        component.allowExclusion = true;
        await openCheckboxFilter();
        const filterEvent = jest.spyOn(component.filterEvent, 'emit');
        const [included, excluded] = checkboxes();
        included.click();
        excluded.click();
        excluded.click();
        fixture.detectChanges();

        component.onPerformFilter();
        fixture.detectChanges();
        expect(filterEvent).toHaveBeenLastCalledWith({
            filterType: FilterType.MultiCheckbox,
            name: 'Category',
            selectedIds: [1],
            excludedIds: [2],
        });
        component.onToggleOpenHide();
        fixture.detectChanges();
        expect(checkboxes().map((checkbox) => [checkbox.checked, checkbox.indeterminate])).toEqual([
            [true, false],
            [false, true],
        ]);
    });

    it('renders cached exclusions as indeterminate and counts an exclusion-only filter as applied', async () => {
        component.allowExclusion = true;
        await openCheckboxFilter([TableFilterComponent.mapToFilterOptions(1, 'Groceries', undefined, [1])]);

        expect(checkboxes()[0].checked).toBe(false);
        expect(checkboxes()[0].indeterminate).toBe(true);
        expect(component.isFilterApplied).toBe(true);

        component.onClear();
        fixture.detectChanges();
        component.onToggleOpenHide();
        fixture.detectChanges();
        expect(checkboxes()[0].checked).toBe(false);
        expect(checkboxes()[0].indeterminate).toBe(false);
        expect(component.isFilterApplied).toBe(false);
    });

    it('includes visible options without clearing exclusions hidden by search', async () => {
        component.allowExclusion = true;
        await openCheckboxFilter([
            TableFilterComponent.mapToFilterOptions(1, 'Groceries', undefined, [1]),
            TableFilterComponent.mapToFilterOptions(2, 'Transport', undefined, [2]),
        ]);

        component.onChangeOptionSearchValue('grocer');
        component.onCheckVisibleOptions();
        component.onClearOptionsSearchValue();
        fixture.detectChanges();

        expect(checkboxes().map((checkbox) => [checkbox.checked, checkbox.indeterminate])).toEqual([
            [true, false],
            [false, true],
        ]);
    });
});
