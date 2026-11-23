import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgSelectModule } from '@ng-select/ng-select';

import { CreateEditItemDTO, ItemWithLastUsedPriceDTO, ShoppingListItem } from '@app/interfaces';

import { CoinageDataService } from '../../services/coinage.data-service';
import { NotificationService } from '../../services/notification.service';
import { ItemShoppingListComponent } from './item-shopping-list.component';

describe('ItemShoppingListComponent', () => {
    let component: ItemShoppingListComponent;
    let fixture: ComponentFixture<ItemShoppingListComponent>;
    let data: { getAllItems: jest.Mock; postCreateItem: jest.Mock };
    let notifications: { push: jest.Mock };

    beforeEach(async () => {
        data = {
            getAllItems: jest.fn().mockResolvedValue([]),
            postCreateItem: jest.fn().mockResolvedValue({ insertedId: 13 }),
        };
        notifications = { push: jest.fn() };
        await TestBed.configureTestingModule({
            imports: [NgSelectModule],
            declarations: [ItemShoppingListComponent],
            providers: [
                { provide: CoinageDataService, useValue: data },
                { provide: NotificationService, useValue: notifications },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(ItemShoppingListComponent);
        component = fixture.componentInstance;
    });

    async function load(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        await fixture.whenStable();
    }

    it('should create', async () => {
        await load();
        expect(component).toBeTruthy();
    });

    it('waits for the picker request before showing the controls', async () => {
        let resolveItems!: (items: ItemWithLastUsedPriceDTO[]) => void;
        data.getAllItems.mockReturnValue(new Promise<ItemWithLastUsedPriceDTO[]>((resolve) => (resolveItems = resolve)));
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('ng-select')).toBeNull();

        resolveItems([]);
        await fixture.whenStable();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('ng-select')).not.toBeNull();
    });

    it('keeps historical items editable when every catalog item is archived', async () => {
        const historicalItem = new ShoppingListItem(12, 'Archived milk', 2, 3, 6, 0, 5);
        component.preselectedItems = [historicalItem];
        component.ngOnChanges();
        const changed = jest.spyOn(component.itemListChanged, 'emit');
        await load();

        expect(component.searchableItems).toEqual([]);
        expect(fixture.nativeElement.querySelector('.item-name')?.textContent).toContain('Archived milk');
        const quantityInput: HTMLInputElement = fixture.nativeElement.querySelector('.quantity-input');
        expect(quantityInput.value).toBe('2');
        quantityInput.value = '4';
        quantityInput.dispatchEvent(new Event('input'));
        await fixture.whenStable();

        expect(historicalItem).toMatchObject({ id: 12, amount: 4, totalPrice: 12 });
        expect(changed).toHaveBeenCalledWith([historicalItem]);
    });

    it('allows creating a new item when the active picker is empty', async () => {
        component.selectedCategoryId = 5;
        await load();
        expect(fixture.nativeElement.querySelector('ng-select')).not.toBeNull();

        const addedItem = await component.onAddNewItem('New milk');

        expect(data.postCreateItem).toHaveBeenCalledWith(new CreateEditItemDTO(null, null, 'New milk', 5, null, null));
        expect(component.searchableItems).toEqual([addedItem]);
        expect(addedItem).toMatchObject({ id: 13, name: 'New milk' });
        expect(notifications.push).toHaveBeenCalledWith({ title: 'Item Created', message: 'New milk' });
    });
});
