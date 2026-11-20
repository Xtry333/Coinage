import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { ShoppingListItem } from '@app/interfaces';

import { CoinageDataService } from '../services/coinage.data-service';
import { CreateEditTransferComponent } from './create-edit-transfer.component';

describe('CreateEditTransferComponent', () => {
    let component: CreateEditTransferComponent;
    let fixture: ComponentFixture<CreateEditTransferComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule, HttpClientTestingModule],
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
});
