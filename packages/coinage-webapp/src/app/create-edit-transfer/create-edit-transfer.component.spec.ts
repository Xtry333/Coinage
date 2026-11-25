import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NgSelectModule } from '@ng-select/ng-select';
import { of } from 'rxjs';

import { ShoppingListItem, TransferDetailsDTO } from '@app/interfaces';

import { CreateEditTransferComponent } from './create-edit-transfer.component';
import { CoinageDataService } from '../services/coinage.data-service';

describe('CreateEditTransferComponent', () => {
    let component: CreateEditTransferComponent;
    let fixture: ComponentFixture<CreateEditTransferComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule, HttpClientTestingModule, NgSelectModule],
            declarations: [CreateEditTransferComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        paramMap: of({
                            get: () => {
                                return 1;
                            },
                        }),
                    },
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CreateEditTransferComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('places direct tags after Date in a single form grid column', async () => {
        const data = TestBed.inject(CoinageDataService);
        TestBed.inject(ActivatedRoute).params = of({});
        jest.spyOn(component, 'todayInputFormat', 'get').mockReturnValue('2026-11-01');
        jest.spyOn(data, 'getCategoryList').mockResolvedValue([]);
        jest.spyOn(data, 'getContractorList').mockResolvedValue([]);
        jest.spyOn(data, 'getContainerList').mockResolvedValue([]);
        jest.spyOn(data, 'getAllAvailableAccounts').mockResolvedValue([]);

        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const dateField: HTMLElement = fixture.nativeElement.querySelector('#date').parentElement;
        const tagsField: HTMLElement = fixture.nativeElement.querySelector('app-tag-selector').parentElement;
        expect(tagsField).toBe(dateField.nextElementSibling);
        expect(tagsField.parentElement).toBe(dateField.parentElement);
        expect(tagsField.parentElement?.classList.contains('lg:grid-cols-3')).toBe(true);
        expect(tagsField.classList.contains('col-span-1')).toBe(true);
        expect(tagsField.querySelector('app-tag-badges')).not.toBeNull();
    });

    it('shows one effective tag when direct and inherited assignments overlap', () => {
        const tag = { id: 1, name: 'Holiday', color: null };
        component.availableTags = [tag];
        component.selectedTransferInputs = { amount: 10, date: '2026-11-01', description: 'Test', tagIds: [1] };
        component.itemsInTransfer = [new ShoppingListItem(10, 'Sunscreen', 1, 10, 10, 0, 1, null, null, [tag])];
        expect(component.effectiveTags).toEqual([{ ...tag, isDirect: true, isInherited: true }]);

        component.selectedTransferInputs.tagIds = [];
        expect(component.effectiveTags).toEqual([{ ...tag, isDirect: false, isInherited: true }]);

        component.itemsInTransfer = [];
        expect(component.effectiveTags).toEqual([]);
    });

    it('saves only direct tag IDs, never inherited tags, in granular edits', () => {
        const data = TestBed.inject(CoinageDataService);
        const save = jest.spyOn(data, 'postGranularSaveTransfer').mockReturnValue(of({}));
        component.editMode = true;
        component.transferId = 3;
        component.redirectAfterSave = false;
        component.selectedTransferInputs = { amount: 10, date: '2026-11-01', description: 'Test', tagIds: [1, 1] };
        component.itemsInTransfer = [new ShoppingListItem(10, 'Milk', 1, 10, 10, 0, 1, null, 5, [{ id: 2, name: 'Food', color: null }])];

        component.onClickSaveTransfer();
        expect(save.mock.calls[0][0].tagIds).toEqual([1]);
        expect(save.mock.calls[0][0].tagIds).not.toContain(2);
    });

    it('detects a packaging-only edit even when both sizes use the same container', () => {
        const data = TestBed.inject(CoinageDataService);
        const save = jest.spyOn(data, 'postGranularSaveTransfer').mockReturnValue(of({}));
        component.editMode = true;
        component.transferId = 3;
        component.redirectAfterSave = false;
        component.selectedTransferInputs = { amount: 10, date: '2026-11-01', description: 'Test' };
        component.originalItemsInTransfer = [new ShoppingListItem(10, 'Cola', 1, 10, 10, 0, 1, 7, 5, [], 41)];
        component.itemsInTransfer = [new ShoppingListItem(10, 'Cola', 1, 10, 10, 0, 1, 7, 5, [], 42)];
        component.onClickSaveTransfer();
        expect(save.mock.calls[0][0].itemChanges.editedItems).toEqual([expect.objectContaining({ packagingId: 42, containerId: 7 })]);
    });

    it('sends gross prices and total set discounts when creating a transfer', () => {
        const data = TestBed.inject(CoinageDataService);
        const save = jest.spyOn(data, 'postCreateSaveTransfer').mockReturnValue(of({}));
        component.redirectAfterSave = false;
        component.selectedTransferInputs = { amount: 13, date: '2026-11-01', description: 'Milk' };
        component.itemsInTransfer = [new ShoppingListItem(10, 'Milk', 3, 5, 15, 2, 1)];

        component.onClickSaveTransfer();

        expect(save.mock.calls[0][0]).toMatchObject({
            amount: 13,
            items: [expect.objectContaining({ amount: 3, price: 5, totalPrice: 15, setDiscount: 2 })],
        });
    });

    it.each([3, 0])('detects a discount-only edit to %s when saving an existing transfer', (setDiscount) => {
        const data = TestBed.inject(CoinageDataService);
        const save = jest.spyOn(data, 'postGranularSaveTransfer').mockReturnValue(of({}));
        component.editMode = true;
        component.transferId = 3;
        component.redirectAfterSave = false;
        component.selectedTransferInputs = { amount: 10 - setDiscount, date: '2026-11-01', description: 'Milk' };
        component.originalItemsInTransfer = [new ShoppingListItem(10, 'Milk', 2, 5, 10, 2, 1, null, 5)];
        component.itemsInTransfer = [new ShoppingListItem(10, 'Milk', 2, 5, 10, setDiscount, 1, null, 5)];

        component.onClickSaveTransfer();

        expect(save.mock.calls[0][0].itemChanges).toMatchObject({
            addedItems: [],
            editedItems: [expect.objectContaining({ transferItemId: 5, totalPrice: 10, setDiscount })],
            removedItemIds: [],
        });
    });

    it('preserves the stored gross line price when loading and editing a discounted transfer', async () => {
        const data = TestBed.inject(CoinageDataService);
        const route = TestBed.inject(ActivatedRoute);
        route.params = of({ id: '3' });
        jest.spyOn(component, 'todayInputFormat', 'get').mockReturnValue('2026-11-01');
        jest.spyOn(data, 'getCategoryList').mockResolvedValue([]);
        jest.spyOn(data, 'getContractorList').mockResolvedValue([]);
        jest.spyOn(data, 'getContainerList').mockResolvedValue([]);
        jest.spyOn(data, 'getAllAvailableAccounts').mockResolvedValue([]);
        jest.spyOn(data, 'getTransferDetails').mockResolvedValue(
            Object.assign(new TransferDetailsDTO(), {
                id: 3,
                amount: 9,
                date: new Date('2026-11-01'),
                description: 'Milk',
                categoryId: 1,
                account: { id: 1, name: 'Cash' },
                targetAccount: { id: 2, name: 'Shop' },
                items: [{ id: 10, itemName: 'Milk', amount: 3, unitPrice: 3.33, totalPrice: 10, setDiscount: 1, transferItemId: 5 }],
            }),
        );
        const save = jest.spyOn(data, 'postGranularSaveTransfer').mockReturnValue(of({}));
        component.redirectAfterSave = false;

        component.ngOnInit();
        await fixture.whenStable();
        expect(component.itemsInTransfer[0]).toMatchObject({ price: 3.33, totalPrice: 10, setDiscount: 1 });

        component.itemsInTransfer[0].setDiscount = 2;
        component.onClickSaveTransfer();
        expect(save.mock.calls[0][0].itemChanges.editedItems).toEqual([expect.objectContaining({ totalPrice: 10, setDiscount: 2 })]);
    });
});
