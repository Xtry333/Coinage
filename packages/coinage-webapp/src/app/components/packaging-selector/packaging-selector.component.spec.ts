import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgSelectModule } from '@ng-select/ng-select';

import { ItemPackagingDTO } from '@app/interfaces';

import { PackagingSelectorComponent } from './packaging-selector.component';
import { CoinageDataService } from '../../services/coinage.data-service';

const variant: ItemPackagingDTO = {
    id: 3,
    itemId: 10,
    containerId: 7,
    containerName: 'Can',
    volume: 330,
    volumeUnit: 'ml',
    weight: null,
    weightUnit: null,
    itemCount: 1,
    barcode: null,
    isPreferred: true,
    isArchived: false,
};

describe('PackagingSelectorComponent', () => {
    let component: PackagingSelectorComponent;
    let getItemPackaging: jest.Mock;
    let emit: jest.SpyInstance;

    beforeEach(() => {
        getItemPackaging = jest.fn().mockResolvedValue([variant, { ...variant, id: 4, volume: 500, isPreferred: false }]);
        component = new PackagingSelectorComponent({ getItemPackaging } as unknown as CoinageDataService);
        component.itemId = 10;
        emit = jest.spyOn(component.packagingChange, 'emit');
    });

    it('offers all sizes for this product even when they share one container', async () => {
        await component.load();
        expect(getItemPackaging).toHaveBeenCalledWith(10);
        expect(component.variants.map((p) => p.displayName)).toEqual(['Can · 330 ml · 1 per pack (preferred)', 'Can · 500 ml · 1 per pack']);
        expect(emit).not.toHaveBeenCalled();
    });

    it('selects the preferred variant only for new purchases, never for explicitly loose items', async () => {
        component.autoSelectPreferred = true;
        await component.load();
        expect(emit).toHaveBeenCalledWith(expect.objectContaining({ id: 3 }));
        emit.mockClear();
        component.packagingId = null;
        await component.load();
        expect(emit).not.toHaveBeenCalled();
    });

    it('keeps a historical archived selection available without offering other archived sizes', async () => {
        component.packagingId = 3;
        getItemPackaging.mockResolvedValue([
            { ...variant, isArchived: true },
            { ...variant, id: 4, isArchived: true },
        ]);
        await component.load();
        expect(component.variants.map((p) => p.id)).toEqual([3]);
        expect(component.variants[0].displayName).toContain('archived');
        expect(emit).not.toHaveBeenCalled();
    });

    it('does not guess between two legacy sizes sharing the same container', async () => {
        component.legacyContainerId = 7;
        await component.load();
        expect(emit).not.toHaveBeenCalled();
    });

    it('does not replace a legacy size just because only its newer replacement is active', async () => {
        component.legacyContainerId = 7;
        getItemPackaging.mockResolvedValue([
            { ...variant, isArchived: true },
            { ...variant, id: 4, volume: 500 },
        ]);
        component.autoSelectPreferred = true;
        await component.load();
        expect(emit).not.toHaveBeenCalled();
    });

    it('clears packaging explicitly and selects newly created variants', async () => {
        await component.load();
        component.select(null);
        expect(emit).toHaveBeenLastCalledWith(null);
        component.onCreated({ ...variant, id: 9 });
        expect(emit).toHaveBeenLastCalledWith(expect.objectContaining({ id: 9 }));
        expect(component.packagingId).toBe(9);
    });

    it('ignores stale responses when switching products', async () => {
        let resolveFirst: (value: ItemPackagingDTO[]) => void = () => undefined;
        getItemPackaging.mockReturnValueOnce(new Promise<ItemPackagingDTO[]>((resolve) => (resolveFirst = resolve)));
        const first = component.load();
        component.itemId = 20;
        getItemPackaging.mockResolvedValue([{ ...variant, id: 20, itemId: 20 }]);
        await component.load();
        resolveFirst([variant]);
        await first;
        expect(component.variants.map((p) => p.itemId)).toEqual([20]);
    });

    it('does not select a package created for a previous product', () => {
        component.itemId = 20;
        component.onCreated(variant);
        expect(emit).not.toHaveBeenCalled();
        expect(component.packagingId).toBeUndefined();
    });

    it('reports load failures without overwriting the current selection', async () => {
        component.packagingId = 3;
        getItemPackaging.mockRejectedValue(new Error('Offline'));
        await component.load();
        expect(component.error).toBeTruthy();
        expect(component.packagingId).toBe(3);
        expect(emit).not.toHaveBeenCalled();
    });
});

describe('PackagingSelectorComponent template', () => {
    let fixture: ComponentFixture<PackagingSelectorComponent>;
    let component: PackagingSelectorComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NgSelectModule],
            declarations: [PackagingSelectorComponent],
            providers: [{ provide: CoinageDataService, useValue: { getItemPackaging: jest.fn().mockResolvedValue([variant]) } }],
        }).compileComponents();
        fixture = TestBed.createComponent(PackagingSelectorComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('itemId', 10);
        fixture.componentRef.setInput('packagingId', variant.id);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    });

    it('keeps the add-size action beside the dropdown and toggles a separate editor without changing the selection', () => {
        const emit = jest.spyOn(component.packagingChange, 'emit');
        const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
        const select: HTMLElement = fixture.nativeElement.querySelector('ng-select');
        expect(button.parentElement).toBe(select.parentElement);
        expect(button.textContent).toContain('Add another size');
        expect(button.type).toBe('button');
        expect(button.getAttribute('aria-expanded')).toBe('false');
        expect(fixture.nativeElement.querySelector('[role="region"]')).toBeNull();

        button.click();
        fixture.detectChanges();

        const editor: HTMLElement = fixture.nativeElement.querySelector('[aria-label="Packaging editor"]');
        expect(button.getAttribute('aria-expanded')).toBe('true');
        expect(button.textContent).toContain('Close packaging editor');
        expect(editor.querySelector('app-item-packaging')).not.toBeNull();
        expect(editor.parentElement).toBe(select.parentElement?.parentElement);

        button.click();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('[role="region"]')).toBeNull();
        expect(component.packagingId).toBe(variant.id);
        expect(emit).not.toHaveBeenCalled();
    });

    it('closes the editor and selects a newly saved size', async () => {
        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        const created = { ...variant, id: 9 };
        const emit = jest.spyOn(component.packagingChange, 'emit');
        component.onCreated(created);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(component.packagingId).toBe(created.id);
        expect(emit).toHaveBeenCalledWith(created);
        expect(fixture.nativeElement.querySelector('[role="region"]')).toBeNull();
        expect(fixture.nativeElement.querySelector('button').getAttribute('aria-expanded')).toBe('false');
    });
});
