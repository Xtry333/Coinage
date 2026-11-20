import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { ItemWithContainerDTO } from '@app/interfaces';

import { ItemTableColumn, ItemsListTableComponent } from './items-list-table.component';
import { CoinageDataService } from '../services/coinage.data-service';
import { FilterType } from '../transfers-table/table-filter/table-filter.component';

describe('ItemsListTableComponent tag filtering', () => {
    const holiday = { id: 1, name: 'Holiday', color: null };
    const food = { id: 2, name: 'Food', color: null };
    const items: ItemWithContainerDTO[] = [
        { id: 10, name: 'Milk', categoryId: 5, tags: [food] },
        { id: 20, name: 'Sunscreen', categoryId: 6, tags: [holiday] },
        { id: 30, name: 'Picnic', categoryId: 5, tags: [holiday, food] },
        { id: 40, name: 'Untagged', categoryId: 5, tags: [] },
    ];
    let component: ItemsListTableComponent;

    beforeEach(() => {
        const data = {
            getItemsWithContainers: () => of(items),
            getCategoryList: () => of([]),
            getTags: () => of([holiday, food]),
        };
        component = new ItemsListTableComponent(data as unknown as CoinageDataService);
        component.ngOnInit();
    });

    afterEach(() => component.ngOnDestroy());

    it('matches any selected tag without duplicating a matching item', () => {
        component.onPerformFilter({ filterType: FilterType.MultiCheckbox, name: ItemTableColumn.Tags, selectedIds: [1, 2, 2] });
        expect(component.filteredItems.map((item) => item.id)).toEqual([10, 20, 30]);
        expect(component.filter.tagIds).toEqual([1, 2]);
        expect(component.isAnyFilterApplied).toBe(true);
    });

    it('combines tags with category filters and resets pagination', () => {
        component.currentPage = 3;
        component.onPerformFilter({ filterType: FilterType.MultiCheckbox, name: ItemTableColumn.Category, selectedIds: [5] });
        component.onPerformFilter({ filterType: FilterType.MultiCheckbox, name: ItemTableColumn.Tags, selectedIds: [1] });
        expect(component.filteredItems.map((item) => item.id)).toEqual([30]);
        expect(component.currentPage).toBe(1);
    });

    it('treats an empty tag selection as no tag restriction', () => {
        component.onPerformFilter({ filterType: FilterType.MultiCheckbox, name: ItemTableColumn.Tags, selectedIds: [1] });
        component.onPerformFilter({ filterType: FilterType.MultiCheckbox, name: ItemTableColumn.Tags, selectedIds: [] });
        expect(component.filteredItems).toEqual(items);
        expect(component.isAnyFilterApplied).toBe(false);
    });

    it('matches included tags only when none of the excluded tags are present', () => {
        component.onPerformFilter({ filterType: FilterType.MultiCheckbox, name: ItemTableColumn.Tags, selectedIds: [1], excludedIds: [2, 2] });
        expect(component.filteredItems.map((item) => item.id)).toEqual([20]);
        expect(component.filter.excludedTagIds).toEqual([2]);
    });

    it('supports exclusions without inclusions, preserving untagged items', () => {
        component.currentPage = 3;
        component.onPerformFilter({ filterType: FilterType.MultiCheckbox, name: ItemTableColumn.Tags, selectedIds: [], excludedIds: [2] });
        expect(component.filteredItems.map((item) => item.id)).toEqual([20, 40]);
        expect(component.isAnyFilterApplied).toBe(true);
        expect(component.currentPage).toBe(1);
    });

    it('combines excluded tags with category filters', () => {
        component.onPerformFilter({ filterType: FilterType.MultiCheckbox, name: ItemTableColumn.Category, selectedIds: [5] });
        component.onPerformFilter({ filterType: FilterType.MultiCheckbox, name: ItemTableColumn.Tags, selectedIds: [], excludedIds: [2] });
        expect(component.filteredItems.map((item) => item.id)).toEqual([40]);
    });

    it('removes exclusions when the tag filter is cleared', () => {
        component.onPerformFilter({ filterType: FilterType.MultiCheckbox, name: ItemTableColumn.Tags, selectedIds: [], excludedIds: [2] });
        component.onPerformFilter({ filterType: FilterType.MultiCheckbox, name: ItemTableColumn.Tags, selectedIds: [] });
        expect(component.filteredItems).toEqual(items);
        expect(component.isAnyFilterApplied).toBe(false);
    });

    it('does not label explicitly loose purchases with a deprecated item size', () => {
        expect(component.formatContainer({ ...items[0], packagingId: null, containerSize: 500, containerSizeUnit: 'ml' })).toBe('No container');
    });
});

describe('ItemsListTableComponent edit links', () => {
    it('keeps item names linked to details and sends the edit action to the item form', async () => {
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule],
            declarations: [ItemsListTableComponent],
            providers: [
                {
                    provide: CoinageDataService,
                    useValue: {
                        getItemsWithContainers: () => of([{ id: 12, name: 'Milk', categoryId: 5, tags: [] }]),
                        getCategoryList: () => of([]),
                        getTags: () => of([]),
                    },
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        const fixture = TestBed.createComponent(ItemsListTableComponent);
        fixture.detectChanges();
        const links: HTMLAnchorElement[] = Array.from(fixture.nativeElement.querySelectorAll('tbody a'));
        expect(links.map((link) => link.getAttribute('href'))).toEqual(['/item/details/12', '/item/edit/12']);
        expect(fixture.nativeElement.querySelector('app-button-icon').getAttribute('ariaLabel')).toBe('Edit item');
    });
});

describe('ItemsListTableComponent packaging filtering', () => {
    it('distinguishes named variants independently of legacy container references', () => {
        const items: ItemWithContainerDTO[] = [
            { id: 10, name: 'Red Bull', categoryId: 5, tags: [], packagingId: 21, containerId: 7, containerName: 'Can' },
            { id: 10, name: 'Red Bull', categoryId: 5, tags: [], packagingId: 22, containerId: 7, containerName: 'Box' },
            { id: 10, name: 'Red Bull', categoryId: 5, tags: [], packagingId: 23, containerId: null, containerName: 'Pallet' },
        ];
        const component = new ItemsListTableComponent({
            getItemsWithContainers: () => of(items),
            getCategoryList: () => of([]),
            getTags: () => of([]),
        } as unknown as CoinageDataService);
        component.ngOnInit();
        component.onPerformFilter({ filterType: FilterType.MultiCheckbox, name: ItemTableColumn.Container, selectedIds: [22] });
        expect(component.filteredItems).toEqual([items[1]]);
        component.onPerformFilter({ filterType: FilterType.MultiCheckbox, name: ItemTableColumn.Container, selectedIds: [23] });
        expect(component.filteredItems).toEqual([items[2]]);
        component.ngOnDestroy();
    });
});
