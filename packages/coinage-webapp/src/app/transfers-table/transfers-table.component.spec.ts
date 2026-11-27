import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { FilterType, TableFilterComponent } from './table-filter/table-filter.component';
import { TransfersTableComponent } from './transfers-table.component';
import { AppliedFiltersComponent } from '../components/applied-filters/applied-filters.component';
import { CoinageStorageService } from '../core/services/storage-service/coinage-storage.service';
import { CoinageDataService } from '../services/coinage.data-service';

describe('TransferTableComponent', () => {
    let component: TransfersTableComponent;
    let fixture: ComponentFixture<TransfersTableComponent>;
    const dataService = {
        getCategoryList: jest.fn(() => of([{ id: 1, name: 'Groceries' }])),
        getAllAvailableAccounts: jest.fn(() => of([{ id: 2, name: 'Cash' }])),
        getContractorList: jest.fn(() => of([{ id: 3, name: 'Store' }])),
        getTags: jest.fn(() => of([{ id: 4, name: 'Holiday', color: null }])),
    };
    const storage = {
        getBoolean: jest.fn(),
        getObject: jest.fn(),
        setObject: jest.fn(),
    };

    beforeEach(async () => {
        jest.spyOn(console, 'log').mockImplementation(() => undefined);
        storage.getObject.mockReset();
        storage.setObject.mockClear();
        await TestBed.configureTestingModule({
            imports: [CommonModule],
            declarations: [TransfersTableComponent, TableFilterComponent, AppliedFiltersComponent],
            providers: [
                { provide: CoinageDataService, useValue: dataService },
                { provide: CoinageStorageService, useValue: storage },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TransfersTableComponent);
        component = fixture.componentInstance;
        component.transfers = [];
        component.showFilters = true;
        component.showTodayMarker = false;
        component.filterCachePath = 'test.filters';
        component.lastPageNumber = 0;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('describes every applied filter using selected names and values, including cached dates', () => {
        storage.getObject.mockReturnValue({
            categoryIds: [1],
            description: 'Lunch',
            accountIds: [2],
            amountFrom: 0,
            amountTo: 100,
            contractorIds: [3],
            dateFrom: '2026-11-01',
            dateTo: '2026-11-15',
            showPlanned: true,
            showFlagged: true,
        });
        fixture.detectChanges();

        expect(component.appliedFilters).toEqual([
            { key: 'categoryIds', label: 'Category', value: 'Groceries' },
            { key: 'description', label: 'Description', value: 'Lunch' },
            { key: 'accountIds', label: 'Origin account', value: 'Cash' },
            { key: 'amount', label: 'Amount', value: '0 – 100' },
            { key: 'contractorIds', label: 'Contractor', value: 'Store' },
            { key: 'date', label: 'Date', value: 'Nov 1, 2026 – Nov 15, 2026' },
            { key: 'showPlanned', label: 'Show planned transfers' },
            { key: 'showFlagged', label: 'Only flagged transfers' },
        ]);
    });

    it('does not count empty values, empty selections or disabled toggles as applied filters', () => {
        component.filter = {
            description: ' ',
            categoryIds: [],
            accountIds: [],
            contractorIds: [],
            showPlanned: false,
            showFlagged: false,
        };

        expect(component.appliedFilters).toEqual([]);
        expect(component.isAnyFilterApplied).toBe(false);
    });

    it('uses applied selections rather than draft checkbox values', () => {
        fixture.detectChanges();
        component.filter.categoryIds = [1];
        component.optionsForCheckboxFilters.categories = [
            TableFilterComponent.mapToFilterOptions(1, 'Groceries'),
            TableFilterComponent.mapToFilterOptions(4, 'Transport', [4]),
        ];

        expect(component.appliedFilters).toEqual([{ key: 'categoryIds', label: 'Category', value: 'Groceries' }]);
    });

    it('identifies selected options even when their names are unavailable', () => {
        component.filter.categoryIds = [99];

        expect(component.appliedFilters).toEqual([{ key: 'categoryIds', label: 'Category', value: '#99' }]);
    });

    it('keeps the summary and clear link above the table when no transfers match', () => {
        storage.getObject.mockReturnValue({ description: 'No matching transfers' });
        fixture.detectChanges();

        const summary: HTMLElement = fixture.nativeElement.querySelector('app-applied-filters');
        const table: HTMLElement = fixture.nativeElement.querySelector('table');
        expect(summary.textContent).toContain('No matching transfers');
        expect(summary.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(summary.querySelector('button')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('app-pagination')).toBeNull();
    });

    it('clears all filter state, cached values and column controls with one filter event', async () => {
        fixture.detectChanges();
        const columnFilters = fixture.debugElement
            .queryAll(By.directive(TableFilterComponent))
            .map((element) => element.componentInstance as TableFilterComponent);
        columnFilters.forEach((columnFilter) => {
            switch (columnFilter.filterType) {
                case FilterType.TextBox:
                    columnFilter.filterValue = { filterType: FilterType.TextBox, name: columnFilter.filterName, value: 'Lunch' };
                    break;
                case FilterType.NumericRange:
                    columnFilter.filterValue = { filterType: FilterType.NumericRange, name: columnFilter.filterName, range: { from: 0, to: 100 } };
                    break;
                case FilterType.DateRange:
                    columnFilter.filterValue = {
                        filterType: FilterType.DateRange,
                        name: columnFilter.filterName,
                        range: { from: '2026-11-01', to: '2026-11-15' },
                    };
                    break;
                case FilterType.MultiCheckbox:
                    columnFilter.filterOptions?.forEach((option) => (option.isSelected = true));
                    break;
            }
            columnFilter.onPerformFilter();
        });
        component.showAllChecked(true);
        component.showFlaggedChecked(true);
        component.currentPage = 4;
        fixture.detectChanges();
        await fixture.whenStable();
        const filterEvent = jest.spyOn(component.tableFilter, 'emit');

        fixture.nativeElement.querySelector('button[aria-label="Clear all filters"]').click();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(component.filter).toEqual({});
        expect(component.appliedFilters).toEqual([]);
        expect(component.currentPage).toBe(4);
        expect(storage.setObject).toHaveBeenLastCalledWith('test.filters', undefined);
        expect(filterEvent).toHaveBeenCalledTimes(1);
        expect(filterEvent).toHaveBeenCalledWith({});
        expect(columnFilters.every((columnFilter) => !columnFilter.isFilterApplied && !columnFilter.isPopupDisplayed)).toBe(true);
        expect(
            Object.values(component.optionsForCheckboxFilters)
                .flat()
                .every((option) => !option.isSelected && option.isDisplayed),
        ).toBe(true);
        expect(fixture.nativeElement.querySelector('#showAllCheckbox').checked).toBe(false);
        expect(fixture.nativeElement.querySelector('#showFlaggedCheckbox').checked).toBe(false);
        expect(fixture.nativeElement.querySelector('button[aria-label="Clear all filters"]')).toBeNull();
    });

    it('hides the summary on tables without filters', () => {
        component.showFilters = false;
        component.filter.description = 'Lunch';
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('app-applied-filters')).toBeNull();
    });

    it('restores cached tag selections and describes the any-tag filter', () => {
        storage.getObject.mockReturnValue({ tagIds: [4] });
        fixture.detectChanges();

        expect(component.optionsForCheckboxFilters.tags[0].isSelected).toBe(true);
        expect(component.appliedFilters).toEqual([{ key: 'tagIds', label: 'Tags (any)', value: 'Holiday' }]);
    });

    it('emits distinct tag IDs for server-side filtering', () => {
        fixture.detectChanges();
        const emitted = jest.spyOn(component.tableFilter, 'emit');
        component.onPerformFilter({ filterType: FilterType.MultiCheckbox, name: 'Tags', selectedIds: [4, 4] });

        expect(emitted).toHaveBeenLastCalledWith({ tagIds: [4] });
        expect(storage.setObject).toHaveBeenLastCalledWith('test.filters', { tagIds: [4] });
        expect(component.currentPage).toBe(1);
    });

    it('restores excluded tags and enables three-state checkboxes only for tags', () => {
        storage.getObject.mockReturnValue({ excludedTagIds: [4] });
        fixture.detectChanges();

        expect(component.optionsForCheckboxFilters.tags[0].isExcluded).toBe(true);
        expect(component.optionsForCheckboxFilters.tags[0].isSelected).toBe(false);
        expect(component.appliedFilters).toEqual([{ key: 'excludedTagIds', label: 'Tags (none)', value: 'Holiday' }]);
        expect(component.isAnyFilterApplied).toBe(true);
        const columnFilters = fixture.debugElement
            .queryAll(By.directive(TableFilterComponent))
            .map((element) => element.componentInstance as TableFilterComponent);
        expect(columnFilters.filter((filter) => filter.allowExclusion).map((filter) => filter.filterName)).toEqual(['Tags']);
    });

    it('persists distinct included and excluded tag IDs and clears exclusions when removed', () => {
        fixture.detectChanges();
        const emitted = jest.spyOn(component.tableFilter, 'emit');
        component.onPerformFilter({ filterType: FilterType.MultiCheckbox, name: 'Tags', selectedIds: [4, 4], excludedIds: [5, 5] });

        expect(emitted).toHaveBeenLastCalledWith({ tagIds: [4], excludedTagIds: [5] });
        expect(storage.setObject).toHaveBeenLastCalledWith('test.filters', { tagIds: [4], excludedTagIds: [5] });
        expect(component.appliedFilters).toEqual([
            { key: 'tagIds', label: 'Tags (any)', value: 'Holiday' },
            { key: 'excludedTagIds', label: 'Tags (none)', value: '#5' },
        ]);

        component.onPerformFilter({ filterType: FilterType.MultiCheckbox, name: 'Tags', selectedIds: [4], excludedIds: [] });
        expect(component.filter.excludedTagIds).toBeUndefined();
        expect(emitted).toHaveBeenLastCalledWith({ tagIds: [4] });
    });

    it('clears excluded tags from controls, storage and the request when clearing all filters', () => {
        storage.getObject.mockReturnValue({ excludedTagIds: [4] });
        fixture.detectChanges();
        const emitted = jest.spyOn(component.tableFilter, 'emit');

        component.clearAllFilters();
        expect(component.optionsForCheckboxFilters.tags[0].isExcluded).toBe(false);
        expect(component.isAnyFilterApplied).toBe(false);
        expect(emitted).toHaveBeenLastCalledWith({});
        expect(storage.setObject).toHaveBeenLastCalledWith('test.filters', undefined);
    });

    it('removes a clicked filter chip while preserving other filters and Clear all', () => {
        storage.getObject.mockReturnValue({ categoryIds: [1], description: 'Lunch' });
        fixture.detectChanges();
        component.currentPage = 4;
        const emitted = jest.spyOn(component.tableFilter, 'emit');

        fixture.nativeElement.querySelector('button[aria-label="Remove Category filter: Groceries"]').click();
        fixture.detectChanges();

        expect(component.filter).toEqual({ description: 'Lunch' });
        expect(component.optionsForCheckboxFilters.categories[0].isSelected).toBe(false);
        expect(component.currentPage).toBe(1);
        expect(emitted).toHaveBeenCalledTimes(1);
        expect(emitted).toHaveBeenLastCalledWith({ description: 'Lunch' });
        expect(storage.setObject).toHaveBeenLastCalledWith('test.filters', { description: 'Lunch' });
        expect(fixture.nativeElement.querySelector('button[aria-label="Remove Category filter: Groceries"]')).toBeNull();
        expect(fixture.nativeElement.querySelector('button[aria-label="Clear all filters"]')).not.toBeNull();
    });

    it.each([
        { key: 'categoryIds', filter: { categoryIds: [1], category: 'Groceries' }, column: 'Category' },
        { key: 'description', filter: { description: 'Lunch' }, column: 'Description' },
        { key: 'accountIds', filter: { accountIds: [2], account: 'Cash' }, column: 'Account' },
        { key: 'contractorIds', filter: { contractorIds: [3], contractor: 'Store' }, column: 'Contractor' },
        { key: 'amount', filter: { amountFrom: 0, amountTo: 100 }, column: 'Amount' },
        { key: 'date', filter: { dateFrom: new Date('2026-11-01'), dateTo: new Date('2026-11-15') }, column: 'Date' },
        { key: 'showPlanned', filter: { showPlanned: true }, column: undefined },
        { key: 'showFlagged', filter: { showFlagged: true }, column: undefined },
    ])('removes the entire $key filter and resets its control', ({ key, filter, column }) => {
        storage.getObject.mockReturnValue(filter);
        fixture.detectChanges();
        const columnFilter = fixture.debugElement
            .queryAll(By.directive(TableFilterComponent))
            .map((element) => element.componentInstance as TableFilterComponent)
            .find((control) => control.filterName === column);
        const reset = columnFilter ? jest.spyOn(columnFilter, 'reset') : undefined;

        component.removeFilter(key);
        fixture.detectChanges();

        expect(component.filter).toEqual({});
        expect(component.isAnyFilterApplied).toBe(false);
        expect(storage.setObject).toHaveBeenLastCalledWith('test.filters', undefined);
        expect(fixture.nativeElement.querySelector('[aria-label="Applied filters"]')).toBeNull();
        if (reset) {
            expect(reset).toHaveBeenCalledTimes(1);
            expect(columnFilter?.isFilterApplied).toBe(false);
        }
    });

    it.each(['tagIds', 'excludedTagIds'])('removes $key without changing the other tag state', (key) => {
        storage.getObject.mockReturnValue({ tagIds: [4], excludedTagIds: [5] });
        fixture.detectChanges();
        component.optionsForCheckboxFilters.tags.push(TableFilterComponent.mapToFilterOptions(5, 'Groceries', undefined, [5]));
        const tagsControl = fixture.debugElement
            .queryAll(By.directive(TableFilterComponent))
            .map((element) => element.componentInstance as TableFilterComponent)
            .find((control) => control.filterName === 'Tags');

        component.removeFilter(key);
        fixture.detectChanges();

        const expected = key === 'tagIds' ? { excludedTagIds: [5] } : { tagIds: [4] };
        expect(component.filter).toEqual(expected);
        expect(component.optionsForCheckboxFilters.tags.map((option) => [option.isSelected, option.isExcluded])).toEqual(
            key === 'tagIds'
                ? [
                      [false, false],
                      [false, true],
                  ]
                : [
                      [true, false],
                      [false, false],
                  ],
        );
        expect(tagsControl?.isFilterApplied).toBe(true);
        tagsControl?.onPerformFilter();
        expect(component.filter.tagIds).toEqual(expected.tagIds ?? []);
        expect(component.filter.excludedTagIds).toEqual(expected.excludedTagIds);
    });
});

describe('TransfersTableComponent bulk edit mode persistence', () => {
    const key = 'transfers.table.bulkEditMode';
    const storedKey = CoinageStorageService.KEY_BOOLEAN_TEMPLATE(key);

    function createTable(): TransfersTableComponent {
        const table = new TransfersTableComponent({} as CoinageDataService, new CoinageStorageService());
        table.transfers = [];
        table.showTodayMarker = false;
        table.enableBulkActions = true;
        table.ngOnInit();
        return table;
    }

    beforeEach(() => {
        window.localStorage.removeItem(storedKey);
    });

    afterEach(() => {
        window.localStorage.removeItem(storedKey);
    });

    it('defaults to disabled when there is no saved preference', () => {
        expect(createTable().isBulkEditMode).toBe(false);
    });

    it.each([true, false])('restores an existing %s preference', (value) => {
        window.localStorage.setItem(storedKey, String(value));

        expect(createTable().isBulkEditMode).toBe(value);
    });

    it('stays disabled after enabling, disabling and recreating the table', () => {
        const table = createTable();
        table.isBulkEditMode = true;
        table.onBulkEditModeChanged();
        expect(createTable().isBulkEditMode).toBe(true);

        table.selectedTransferIds.add(1);
        table.isBulkEditMode = false;
        table.onBulkEditModeChanged();

        expect(table.selectedTransferIds.size).toBe(0);
        expect(window.localStorage.getItem(storedKey)).toBe('false');
        expect(createTable().isBulkEditMode).toBe(false);
    });
});
