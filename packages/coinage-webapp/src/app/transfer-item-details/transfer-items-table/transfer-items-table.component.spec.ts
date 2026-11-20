import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Unit } from '@app/common-units';
import { ItemDetailsDTO, TransferWithItemDetailsDTO } from '@app/interfaces';

import { TransferItemsTableComponent } from './transfer-items-table.component';

describe('TransferTableComponent', () => {
    let component: TransferItemsTableComponent;
    let fixture: ComponentFixture<TransferItemsTableComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TransferItemsTableComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TransferItemsTableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it.each([null, 7])('does not infer a legacy size for packaging selection %p with unknown contents', (packagingId) => {
        component.item = { container: { size: 500, unit: Unit.ML } } as ItemDetailsDTO;
        const line = { packagingId, unitPrice: 12 } as TransferWithItemDetailsDTO;
        expect(component.getStandardPrice(line)).toBe('—');
    });

    it('uses total package contents for price comparisons and retains the legacy response fallback', () => {
        component.item = { container: { size: 500, unit: Unit.ML } } as ItemDetailsDTO;
        expect(
            component.getStandardPrice({ packagingId: 7, unitPrice: 48, containerVolume: 6, containerVolumeUnit: Unit.L } as TransferWithItemDetailsDTO),
        ).toBe('8.000 zł/L');
        expect(component.getStandardPrice({ unitPrice: 12 } as TransferWithItemDetailsDTO)).toBe('24.000 zł/L');
    });
});
