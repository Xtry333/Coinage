import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { of } from 'rxjs';

import { ItemPackagingDTO } from '@app/interfaces';

import { CoinageDataService } from '../../services/coinage.data-service';
import { NotificationService } from '../../services/notification.service';
import { ItemPackagingComponent } from './item-packaging.component';

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

describe('ItemPackagingComponent', () => {
    let component: ItemPackagingComponent;
    let fixture: ComponentFixture<ItemPackagingComponent>;
    let data: {
        getItemPackaging: jest.Mock;
        getContainerList: jest.Mock;
        saveItemPackaging: jest.Mock;
        setItemPackagingState: jest.Mock;
        createContainerFormat: jest.Mock;
    };
    let notifications: { push: jest.Mock; error: jest.Mock };

    beforeEach(async () => {
        data = {
            getItemPackaging: jest.fn().mockResolvedValue([variant]),
            getContainerList: jest.fn().mockReturnValue(of([{ id: 7, name: 'Can' }])),
            saveItemPackaging: jest.fn().mockResolvedValue({ ...variant, id: 4, volume: 500 }),
            setItemPackagingState: jest.fn().mockResolvedValue({ insertedId: 3 }),
            createContainerFormat: jest.fn().mockResolvedValue({ id: 8, name: 'Bottle' }),
        };
        notifications = { push: jest.fn(), error: jest.fn() };
        await TestBed.configureTestingModule({
            imports: [FormsModule, NgSelectModule],
            declarations: [ItemPackagingComponent],
            providers: [
                { provide: CoinageDataService, useValue: data },
                { provide: NotificationService, useValue: notifications },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(ItemPackagingComponent);
        component = fixture.componentInstance;
        component.itemId = 10;
        await component.load();
        fixture.detectChanges();
    });

    it('shows available sizes without relying on any purchase history', () => {
        expect(fixture.nativeElement.textContent).toContain('Can · 330 ml · 1 per pack');
        expect(fixture.nativeElement.textContent).toContain('Preferred');
    });

    it('shows per-item contents for a multipack without confusing pack count with purchased quantity', () => {
        expect(component.perItemLabel({ ...variant, volume: 1980, itemCount: 6 })).toBe('330 ml');
        expect(component.perItemLabel(variant)).toBe('');
    });

    it('edits an independent draft and sends the old ID for a history-safe replacement', async () => {
        component.start(variant, true);
        const draft = component.draft;
        if (!draft) throw new Error('Missing draft');
        draft.volume = 500;
        const emitted = jest.spyOn(component.saved, 'emit');
        await component.save();
        expect(data.saveItemPackaging).toHaveBeenCalledWith(10, expect.objectContaining({ containerId: 7, volume: 500 }), 3);
        expect(variant.volume).toBe(330);
        expect(component.draft).toBeUndefined();
        expect(emitted).toHaveBeenCalledWith(expect.objectContaining({ id: 4 }));
    });

    it('duplicates without replacing the original or copying its preferred flag/barcode', async () => {
        component.start({ ...variant, barcode: '1234' });
        expect(component.draft).toMatchObject({ volume: 330, isPreferred: false, barcode: null });
        await component.save();
        expect(data.saveItemPackaging.mock.calls[0][2]).toBeUndefined();
    });

    it('renders an independent editor with clearly labelled total net sizes', async () => {
        component.start(variant, true);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(fixture.nativeElement.textContent).toContain('Total net volume');
        expect(fixture.nativeElement.textContent).toContain('Total net weight');
        expect(fixture.nativeElement.querySelector('input[name="volume"]').value).toBe('330');
        expect(fixture.nativeElement.querySelector('form')).toBeNull();
        const saveButton = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).find(
            (button) => button.textContent?.trim() === 'Save packaging',
        );
        expect(saveButton?.type).toBe('button');
        expect(saveButton?.disabled).toBe(false);
    });

    it.each([{ volume: 0 }, { volume: 330, volumeUnit: null }, { weight: 100, weightUnit: 'ml' }, { itemCount: 0.5 }, { itemCount: 2147483648 }])(
        'does not submit invalid packaging: %p',
        async (patch) => {
            component.start(variant);
            Object.assign(component.draft ?? {}, patch);
            expect(component.valid).toBe(false);
            await component.save();
            expect(data.saveItemPackaging).not.toHaveBeenCalled();
        },
    );

    it('retains the draft on save failure for retry', async () => {
        component.start(variant, true);
        data.saveItemPackaging.mockRejectedValue(new Error('Unavailable'));
        await component.save();
        expect(component.draft).toBeDefined();
        expect(component.saving).toBe(false);
        expect(notifications.error).toHaveBeenCalled();
    });

    it('ignores a completed save after switching products', async () => {
        let finish!: (value: ItemPackagingDTO) => void;
        data.saveItemPackaging.mockReturnValue(new Promise<ItemPackagingDTO>((resolve) => (finish = resolve)));
        component.start(variant);
        const emitted = jest.spyOn(component.saved, 'emit');
        const pending = component.save();
        component.itemId = 20;
        component.ngOnChanges();
        component.draft = { ...variant, name: 'New product draft' };
        finish(variant);
        await pending;
        expect(emitted).not.toHaveBeenCalled();
        expect(component.draft?.name).toBe('New product draft');
    });

    it('handles Enter locally without submitting the surrounding transfer form', async () => {
        component.start(variant);
        fixture.detectChanges();
        await fixture.whenStable();
        const save = jest.spyOn(component, 'save').mockResolvedValue();
        const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
        fixture.nativeElement.querySelector('input[name="volume"]').dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
        expect(save).toHaveBeenCalledTimes(1);
    });

    it('changes preference and archives without editing shared container contents', async () => {
        await component.setState(variant, 'prefer');
        await component.setState(variant, 'archive');
        expect(data.setItemPackagingState.mock.calls).toEqual([
            [10, 3, 'prefer'],
            [10, 3, 'archive'],
        ]);
    });

    it('reuses container formats and only creates a new format when necessary', async () => {
        expect((await component.addContainer(' can ')).id).toBe(7);
        expect(data.createContainerFormat).not.toHaveBeenCalled();
        expect((await component.addContainer('Bottle')).id).toBe(8);
        expect(data.createContainerFormat).toHaveBeenCalledWith('Bottle');
    });

    it('shows read-only packaging without edit actions', () => {
        component.readonly = true;
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).not.toContain('Edit size');
        expect(fixture.nativeElement.textContent).not.toContain('Add packaging variant');
        expect(fixture.nativeElement.textContent).not.toContain('Manage shared / legacy containers');
    });

    it('offers old and unused shared definitions separately from history-safe product edits', () => {
        component.containers.push({ id: 99, name: 'Old unused bottle', weight: null, weightUnit: null, volume: 500, volumeUnit: 'ml', itemCount: null });
        component.editSharedContainer(7);
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain('99 · Old unused bottle · 500 ml');
        expect(fixture.nativeElement.querySelector('app-shared-container-editor')).not.toBeNull();
        expect(component.draft).toBeUndefined();
        expect(component.editingContainer?.id).toBe(7);
    });

    it('refreshes product variants and shared names after a shared container edit', async () => {
        data.getItemPackaging.mockResolvedValue([{ ...variant, containerName: 'Tin', volume: 350 }]);
        await component.onSharedContainerSaved();
        expect(component.variants[0]).toMatchObject({ containerName: 'Tin', volume: 350 });
        expect(component.editingContainerId).toBeNull();
    });

    it('previews and saves a named 24-can box with no manually stored total', async () => {
        const can = { ...variant, name: 'Can', containerId: null, volume: 0.25, volumeUnit: 'l' };
        component.variants = [can];
        component.start();
        if (!component.draft) throw new Error('Missing draft');
        component.draft.name = 'Box';
        component.onContainedPackagingChanged(can.id);
        component.draft.containedCount = 24;
        fixture.detectChanges();
        await fixture.whenStable();
        expect(component.valid).toBe(true);
        expect(component.draftSummary).toBe('Box · 24 × Can · 6 l');
        expect(component.draftPerItem).toBe('0.25 l');
        expect(fixture.nativeElement.textContent).toContain('6 l');
        expect(fixture.nativeElement.querySelector('input[name="volume"]')).toBeNull();
        await component.save();
        expect(data.saveItemPackaging).toHaveBeenCalledWith(
            10,
            expect.objectContaining({
                name: 'Box',
                containedPackagingId: 3,
                containedCount: 24,
                volume: null,
                volumeUnit: null,
                itemCount: null,
            }),
            undefined,
        );
    });

    it('retains an archived contained version while excluding self and descendant choices', () => {
        const can = { ...variant, name: 'Can', isArchived: true };
        const box = { ...variant, id: 4, name: 'Box', containedPackagingId: 3, containedCount: 24, volume: 7920, itemCount: 24 };
        const pallet = { ...box, id: 5, name: 'Pallet', containedPackagingId: 4, containedCount: 10 };
        component.variants = [can, box, pallet];
        component.start(box, true);
        expect(component.containedOptions.map((p) => p.id)).toEqual([3]);
        expect(component.draft).toMatchObject({ name: 'Box', containedPackagingId: 3, volume: null, itemCount: null });
        expect(component.valid).toBe(true);
    });

    it('requires a packaging name without requiring a legacy container link', () => {
        component.start();
        expect(component.valid).toBe(false);
        if (component.draft) component.draft.name = 'Can';
        expect(component.valid).toBe(true);
        expect(component.draft?.containerId).toBeNull();
    });
});
