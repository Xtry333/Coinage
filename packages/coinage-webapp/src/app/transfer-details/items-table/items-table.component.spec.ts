import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransferItemDTO } from '@app/interfaces';

import { ItemsTableComponent } from './items-table.component';

describe('ItemsTableComponent', () => {
    let component: ItemsTableComponent;
    let fixture: ComponentFixture<ItemsTableComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ItemsTableComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ItemsTableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('tracks separate purchased sizes of the same product without duplicate row keys', () => {
        component.items = [
            { id: 10, transferItemId: 100, packagingId: 3, amount: 1, totalPrice: 5, setDiscount: 0 },
            { id: 10, transferItemId: 101, packagingId: 4, amount: 1, totalPrice: 5, setDiscount: 0 },
        ] as TransferItemDTO[];
        component.ngOnChanges();
        expect(component.tableItems.map((item, index) => component.idTracker(index, item))).toEqual(['100', '101']);
    });

    function renderItem(overrides: Partial<TransferItemDTO> = {}): NodeListOf<HTMLTableCellElement> {
        const item: TransferItemDTO = {
            id: 10,
            itemName: 'Milk',
            unit: 'Units',
            amount: 1,
            unitPrice: 11.5,
            totalPrice: 11.5,
            setDiscount: 2,
            transferItemId: 100,
            tags: [],
            ...overrides,
        };
        fixture.componentRef.setInput('items', [item]);
        fixture.detectChanges();
        return fixture.nativeElement.querySelector('tbody tr').querySelectorAll('td');
    }

    it('shows the original unit price struck through beside the discounted price', () => {
        const cells = renderItem();

        expect(cells[1].querySelector('s')?.textContent?.trim()).toBe('11,50');
        expect(cells[1].textContent?.replace(/\s+/g, ' ').trim()).toBe('11,50 9,50 zł');
        expect(cells[3].textContent?.trim()).toBe('9,50 zł');
        expect(component.totalSum).toBe(9.5);
    });

    it.each([
        { amount: 3, totalPrice: 34.5, setDiscount: 6 },
        { amount: 0.5, totalPrice: 5.75, setDiscount: 1 },
    ])('spreads the whole-line discount across $amount units', (overrides) => {
        const cells = renderItem(overrides);

        expect(cells[1].textContent?.replace(/\s+/g, ' ').trim()).toBe('11,50 9,50 zł');
    });

    it('uses the stored line total when calculating the discounted unit price', () => {
        const cells = renderItem({ amount: 3, unitPrice: 3.33, totalPrice: 10, setDiscount: 1 });

        expect(cells[1].textContent?.replace(/\s+/g, ' ').trim()).toBe('3,33 3,00 zł');
        expect(cells[3].textContent?.trim()).toBe('9,00 zł');
    });

    it('shows a zero unit price when the entire line is discounted', () => {
        const cells = renderItem({ setDiscount: 11.5 });

        expect(cells[1].textContent?.replace(/\s+/g, ' ').trim()).toBe('11,50 0,00 zł');
    });

    it('keeps the original unit price without a strikethrough for undiscounted items', () => {
        const cells = renderItem({ setDiscount: 0 });

        expect(cells[1].querySelector('s')).toBeNull();
        expect(cells[1].textContent?.trim()).toBe('11,50 zł');
    });

    it('avoids dividing by zero for a zero-quantity line', () => {
        const cells = renderItem({ amount: 0, totalPrice: 0 });

        expect(cells[1].querySelector('s')).toBeNull();
        expect(cells[1].textContent?.trim()).toBe('11,50 zł');
    });
});
