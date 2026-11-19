import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { AppliedFiltersComponent } from '../components/applied-filters/applied-filters.component';
import { CoinageStorageService } from '../core/services/storage-service/coinage-storage.service';
import { CoinageDataService } from '../services/coinage.data-service';
import { FilterType, TableFilterComponent } from './table-filter/table-filter.component';
import { TransfersTableComponent } from './transfers-table.component';

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
            { label: 'Category', value: 'Groceries' },
            { label: 'Description', value: 'Lunch' },
            { label: 'Source account', value: 'Cash' },
            { label: 'Amount', value: '0 – 100' },
            { label: 'Contractor', value: 'Store' },
            { label: 'Date', value: 'Nov 1, 2026 – Nov 15, 2026' },
            { label: 'Show planned transfers' },
            { label: 'Only flagged transfers' },
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

        expect(component.appliedFilters).toEqual([{ label: 'Category', value: 'Groceries' }]);
    });

    it('identifies selected options even when their names are unavailable', () => {
        component.filter.categoryIds = [99];

        expect(component.appliedFilters).toEqual([{ label: 'Category', value: '#99' }]);
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
        expect(component.appliedFilters).toEqual([{ label: 'Tags (any)', value: 'Holiday' }]);
    });

    it('emits distinct tag IDs for server-side filtering', () => {
        fixture.detectChanges();
        const emitted = jest.spyOn(component.tableFilter, 'emit');
        component.onPerformFilter({ filterType: FilterType.MultiCheckbox, name: 'Tags', selectedIds: [4, 4] });

        expect(emitted).toHaveBeenLastCalledWith({ tagIds: [4] });
        expect(storage.setObject).toHaveBeenLastCalledWith('test.filters', { tagIds: [4] });
        expect(component.currentPage).toBe(1);
    });
});
