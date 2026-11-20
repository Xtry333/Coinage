import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { Unit } from '@app/common-units';
import { BaseResponseDTO, CreateEditItemDTO, ItemDetailsDTO } from '@app/interfaces';

import { EditItemComponent } from './edit-item.component';
import { NavigatorService } from '../app-routing/navigator.service';
import { CoinageDataService } from '../services/coinage.data-service';
import { NotificationService } from '../services/notification.service';

describe('EditItemComponent', () => {
    let component: EditItemComponent;
    let fixture: ComponentFixture<EditItemComponent>;
    let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
    let item: ItemDetailsDTO;
    let data: {
        getItemDetails: jest.Mock;
        getCategoryList: jest.Mock;
        postCreateItem: jest.Mock;
    };
    let navigator: { goTo: jest.Mock; goToNotFoundPage: jest.Mock };
    let notifications: { push: jest.Mock; error: jest.Mock };

    beforeEach(async () => {
        params = new BehaviorSubject(convertToParamMap({ id: '12' }));
        item = {
            id: 12,
            brand: 'Brand',
            itemName: 'Milk',
            categoryId: 5,
            categoryName: 'Groceries',
            tags: [{ id: 2, name: 'Food', color: null }],
            container: { size: 500, unit: Unit.ML },
            itemContainers: [{ id: 3, name: 'Bottle', volume: 500, volumeUnit: Unit.ML }],
            transfersWithItems: [],
            createdDate: new Date('2026-11-01'),
            editedDate: new Date('2026-11-01'),
        };
        data = {
            getItemDetails: jest.fn().mockResolvedValue(item),
            getCategoryList: jest.fn().mockReturnValue(of([{ id: 5, name: 'Groceries' }])),
            postCreateItem: jest.fn().mockResolvedValue({ insertedId: 12 }),
        };
        navigator = { goTo: jest.fn(), goToNotFoundPage: jest.fn() };
        notifications = { push: jest.fn(), error: jest.fn() };
        await TestBed.configureTestingModule({
            imports: [FormsModule, NgSelectModule],
            declarations: [EditItemComponent],
            providers: [
                { provide: ActivatedRoute, useValue: { paramMap: params } },
                { provide: CoinageDataService, useValue: data },
                { provide: NavigatorService, useValue: navigator },
                { provide: NotificationService, useValue: notifications },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(EditItemComponent);
        component = fixture.componentInstance;
    });

    async function load(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        await fixture.whenStable();
    }

    function inputs(): CreateEditItemDTO {
        const inputs = component.selectedItemInputs;
        if (!inputs) throw new Error('Item form has not loaded');
        return inputs;
    }

    it('loads the existing item into an independent editable form', async () => {
        await load();
        expect(data.getItemDetails).toHaveBeenCalledWith(12);
        expect(component.selectedItemInputs).toEqual(new CreateEditItemDTO(12, 'Brand', 'Milk', 5, 500, Unit.ML, [2]));
        expect(component.categories).toEqual([{ id: 5, name: 'Groceries' }]);
        expect(fixture.nativeElement.querySelector('#itemName').value).toBe('Milk');
        expect(fixture.nativeElement.querySelector('#itemBrand').value).toBe('Brand');
        expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBe(false);
    });

    it('submits edits for the same item, preserving legacy container data', async () => {
        await load();
        const nameInput: HTMLInputElement = fixture.nativeElement.querySelector('#itemName');
        nameInput.value = '  Oat milk  ';
        nameInput.dispatchEvent(new Event('input'));
        inputs().brand = '  New brand  ';
        inputs().categoryId = 7;
        inputs().tagIds = [4, 4, 2];
        fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        await fixture.whenStable();

        expect(data.postCreateItem).toHaveBeenCalledWith(new CreateEditItemDTO(12, 'New brand', 'Oat milk', 7, 500, Unit.ML, [4, 2]));
        expect(data.postCreateItem.mock.calls[0][0]).not.toHaveProperty('itemContainers');
        expect(notifications.push).toHaveBeenCalledWith({ title: 'Item Saved', message: 'Oat milk', linkTo: '/item/details/12' });
        expect(navigator.goTo).toHaveBeenCalledWith('/item/details/12');
        expect(component.saving).toBe(false);
    });

    it('allows clearing optional fields and all tags', async () => {
        item.brand = null;
        item.categoryId = null;
        item.container = null;
        await load();
        inputs().brand = ' ';
        inputs().tagIds = [];
        await component.onClickSaveItem();
        expect(data.postCreateItem).toHaveBeenCalledWith(new CreateEditItemDTO(12, null, 'Milk', null, null, null, []));
    });

    it('cancels without saving or mutating the loaded item', async () => {
        await load();
        inputs().name = 'Unsaved name';
        inputs().tagIds?.push(9);
        component.onClickCancelEdit();
        expect(data.postCreateItem).not.toHaveBeenCalled();
        expect(navigator.goTo).toHaveBeenCalledWith('/item/details/12');
        expect(item.itemName).toBe('Milk');
        expect(item.tags.map((tag) => tag.id)).toEqual([2]);
    });

    it.each(['', '   ', 'a'.repeat(51)])('does not save an invalid name: %p', async (name) => {
        await load();
        inputs().name = name;
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBe(true);
        await component.onClickSaveItem();
        expect(data.postCreateItem).not.toHaveBeenCalled();
    });

    it('does not save a brand longer than the database limit', async () => {
        await load();
        inputs().brand = 'a'.repeat(51);
        await component.onClickSaveItem();
        expect(data.postCreateItem).not.toHaveBeenCalled();
    });

    it.each([{}, { error: 'Save failed' }])('keeps edits available when saving returns %p', async (response) => {
        await load();
        inputs().name = 'Edited name';
        data.postCreateItem.mockResolvedValue(response);
        await component.onClickSaveItem();
        expect(notifications.error).toHaveBeenCalled();
        expect(navigator.goTo).not.toHaveBeenCalled();
        expect(inputs().name).toBe('Edited name');
        expect(component.saving).toBe(false);
    });

    it('handles failed requests and allows a retry', async () => {
        await load();
        data.postCreateItem.mockRejectedValueOnce(new Error('Network error'));
        await component.onClickSaveItem();
        expect(notifications.error).toHaveBeenCalled();
        expect(component.saving).toBe(false);
        await component.onClickSaveItem();
        expect(navigator.goTo).toHaveBeenCalledWith('/item/details/12');
    });

    it('prevents duplicate submissions and cancellation while saving', async () => {
        await load();
        let resolveSave!: (response: BaseResponseDTO) => void;
        data.postCreateItem.mockReturnValue(new Promise<BaseResponseDTO>((resolve) => (resolveSave = resolve)));
        const save = component.onClickSaveItem();
        await component.onClickSaveItem();
        component.onClickCancelEdit();
        fixture.detectChanges();
        expect(data.postCreateItem).toHaveBeenCalledTimes(1);
        expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBe(true);
        expect(navigator.goTo).not.toHaveBeenCalled();
        resolveSave({ insertedId: 12 });
        await save;
        expect(component.saving).toBe(false);
    });

    it.each(['0', '-1', 'invalid', '1.5', ''])('rejects invalid route IDs: %p', async (id) => {
        params.next(convertToParamMap({ id }));
        await load();
        expect(navigator.goToNotFoundPage).toHaveBeenCalled();
        expect(data.getItemDetails).not.toHaveBeenCalled();
        expect(fixture.nativeElement.querySelector('form')).toBeNull();
    });

    it.each(['item', 'categories'])('handles failure to load %s without displaying an empty edit form', async (resource) => {
        if (resource === 'item') data.getItemDetails.mockRejectedValue(new Error('Not found'));
        else data.getCategoryList.mockReturnValue(throwError(() => new Error('Unavailable')));
        await load();
        expect(notifications.error).toHaveBeenCalledWith('Could not load item for editing.');
        expect(navigator.goTo).toHaveBeenCalledWith('/items');
        expect(fixture.nativeElement.querySelector('form')).toBeNull();
    });

    it('reloads on route changes and stops listening after destruction', async () => {
        await load();
        data.getItemDetails.mockResolvedValue({ ...item, id: 15, itemName: 'Bread' });
        params.next(convertToParamMap({ id: '15' }));
        await fixture.whenStable();
        fixture.detectChanges();
        expect(inputs().id).toBe(15);
        expect(inputs().name).toBe('Bread');
        fixture.destroy();
        params.next(convertToParamMap({ id: '16' }));
        expect(data.getItemDetails).toHaveBeenCalledTimes(2);
    });
});
