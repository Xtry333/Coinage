import { of } from 'rxjs';

import { ItemWithContainerDTO } from '@app/interfaces';

import { CoinageDataService } from '../services/coinage.data-service';
import { FilterType } from '../transfers-table/table-filter/table-filter.component';
import { ItemTableColumn, ItemsListTableComponent } from './items-list-table.component';

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
});
