import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgSelectModule } from '@ng-select/ng-select';

import { CreateEditItemDTO, ItemWithLastUsedPriceDTO, ShoppingListItem } from '@app/interfaces';

import { ItemShoppingListComponent } from './item-shopping-list.component';
import { CoinageDataService } from '../../services/coinage.data-service';
import { NotificationService } from '../../services/notification.service';

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

    it('adds the total set discount without changing the gross line price and resets it for the next item', async () => {
        const totalChanged = jest.spyOn(component.totalCostChanged, 'emit');
        const listChanged = jest.spyOn(component.itemListChanged, 'emit');
        component.selectedItem = new ShoppingListItem(undefined, 'Milk', 3, 5, 15, 0, 5);
        await load();

        const discountInput: HTMLInputElement = fixture.nativeElement.querySelector('#itemSetDiscount');
        expect(discountInput).not.toBeNull();
        discountInput.value = '2.25';
        discountInput.dispatchEvent(new Event('input'));
        await fixture.whenStable();
        component.onClickAddNewItemToList();

        expect(component.itemList[0]).toMatchObject({ amount: 3, price: 5, totalPrice: 15, setDiscount: 2.25 });
        expect(totalChanged).toHaveBeenLastCalledWith(12.75);
        expect(listChanged).toHaveBeenLastCalledWith(component.itemList);
        expect(component.selectedItem.setDiscount).toBe(0);
    });

    it('defaults an omitted discount to zero when adding an item', () => {
        component.selectedItem = new ShoppingListItem(undefined, 'Milk', 2, 5, 10, undefined, 5);
        component.onClickAddNewItemToList();
        expect(component.itemList[0].setDiscount).toBe(0);
    });

    it('edits and clears a line discount, showing and emitting its net price', async () => {
        const item = new ShoppingListItem(12, 'Milk', 3, 5, 15, 2, 5);
        component.preselectedItems = [item];
        component.ngOnChanges();
        const totalChanged = jest.spyOn(component.totalCostChanged, 'emit');
        const listChanged = jest.spyOn(component.itemListChanged, 'emit');
        await load();

        const discountInput: HTMLInputElement = fixture.nativeElement.querySelector('.discount-input');
        expect(discountInput).not.toBeNull();
        expect(discountInput.value).toBe('2');
        discountInput.value = '3.5';
        discountInput.dispatchEvent(new Event('input'));
        await fixture.whenStable();
        fixture.detectChanges();

        expect(item).toMatchObject({ totalPrice: 15, setDiscount: 3.5 });
        expect(totalChanged).toHaveBeenLastCalledWith(11.5);
        expect(listChanged).toHaveBeenLastCalledWith([item]);
        expect(fixture.nativeElement.querySelector('.total-price').textContent).toContain('11,50');

        discountInput.value = '';
        discountInput.dispatchEvent(new Event('input'));
        await fixture.whenStable();
        expect(item.setDiscount).toBe(0);
        expect(totalChanged).toHaveBeenLastCalledWith(15);
    });

    it('emits discount edits without overwriting a manually entered transfer total', async () => {
        const item = new ShoppingListItem(12, 'Milk', 2, 5, 10, 0, 5);
        component.preselectedItems = [item];
        component.shouldOverrideTotalCostOnChange = false;
        component.ngOnChanges();
        const totalChanged = jest.spyOn(component.totalCostChanged, 'emit');
        const listChanged = jest.spyOn(component.itemListChanged, 'emit');
        await load();

        const discountInput: HTMLInputElement = fixture.nativeElement.querySelector('.discount-input');
        expect(discountInput).not.toBeNull();
        discountInput.value = '2';
        discountInput.dispatchEvent(new Event('input'));
        await fixture.whenStable();

        expect(item.setDiscount).toBe(2);
        expect(listChanged).toHaveBeenLastCalledWith([item]);
        expect(totalChanged).not.toHaveBeenCalled();
    });

    it('keeps the whole-line discount when quantities and unit prices change', () => {
        const item = new ShoppingListItem(12, 'Milk', 2, 5, 10, 2, 5);
        component.itemList = [item];
        const totalChanged = jest.spyOn(component.totalCostChanged, 'emit');

        item.amount = 3;
        component.onItemQuantityChanged(item);
        expect(item).toMatchObject({ totalPrice: 15, setDiscount: 2 });
        expect(totalChanged).toHaveBeenLastCalledWith(13);

        item.price = 6;
        component.onItemPriceChanged(item);
        expect(item).toMatchObject({ totalPrice: 18, setDiscount: 2 });
        expect(totalChanged).toHaveBeenLastCalledWith(16);
    });

    it('totals stored gross prices minus each line discount, including after removal', () => {
        const discounted = new ShoppingListItem(12, 'Milk', 3, 3.33, 10, 1, 5);
        const undiscounted = new ShoppingListItem(13, 'Bread', 1, 4, 4, undefined, 5);
        const removed = new ShoppingListItem(14, 'Eggs', 1, 6, 6, 2, 5);
        component.itemList = [discounted, undiscounted, removed];
        const totalChanged = jest.spyOn(component.totalCostChanged, 'emit');

        component.onRemoveItemFromList(removed);

        expect(totalChanged).toHaveBeenLastCalledWith(13);
        expect(component.itemList).toEqual([discounted, undiscounted]);
    });
});
