import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransfersListComponent } from './transfers-list.component';
import { WindowService } from '../core/services/window-service/window-service.service';
import { CoinageDataService } from '../services/coinage.data-service';

describe('TransfersListComponent', () => {
    let component: TransfersListComponent;
    let fixture: ComponentFixture<TransfersListComponent>;
    const dataService = {
        getAllFilteredTransfers: jest.fn(() => Promise.resolve({ transfers: [], totalCount: 0 })),
    };

    beforeEach(async () => {
        dataService.getAllFilteredTransfers.mockClear();
        await TestBed.configureTestingModule({
            declarations: [TransfersListComponent],
            providers: [
                { provide: CoinageDataService, useValue: dataService },
                { provide: WindowService, useValue: { getWindow: () => ({ scroll: jest.fn() }) } },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TransfersListComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('removes all previous request filters when clearing while preserving pagination', () => {
        component.filterParams = { page: 3, rowsPerPage: 50 };
        component.onPerformFilter({
            categoryIds: [1],
            description: 'Lunch',
            accountIds: [2],
            contractorIds: [3],
            amountFrom: 0,
            amountTo: 100,
            dateFrom: new Date('2026-11-01'),
            dateTo: new Date('2026-11-15'),
            showPlanned: true,
            showFlagged: true,
        });

        component.onPerformFilter({});

        expect(dataService.getAllFilteredTransfers).toHaveBeenLastCalledWith({
            page: 3,
            rowsPerPage: 50,
            amount: undefined,
            date: undefined,
        });
        expect(component.filterParams.description).toBeUndefined();
        expect(component.filterParams.categoryIds).toBeUndefined();
        expect(component.filterParams.accountIds).toBeUndefined();
        expect(component.filterParams.contractorIds).toBeUndefined();
        expect(component.filterParams.showPlanned).toBeUndefined();
        expect(component.filterParams.showFlagged).toBeUndefined();
    });
});
