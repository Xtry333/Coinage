import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { ContainerDTO } from '@app/interfaces';

import { CoinageDataService } from '../../services/coinage.data-service';
import { NotificationService } from '../../services/notification.service';
import { SharedContainerEditorComponent } from './shared-container-editor.component';

describe('SharedContainerEditorComponent', () => {
    let fixture: ComponentFixture<SharedContainerEditorComponent>;
    let component: SharedContainerEditorComponent;
    let container: ContainerDTO;
    let data: { updateSharedContainer: jest.Mock };
    let notifications: { push: jest.Mock };

    beforeEach(async () => {
        container = { id: 7, name: 'Can', weight: null, weightUnit: null, volume: 330, volumeUnit: 'ml', itemCount: 1 };
        data = { updateSharedContainer: jest.fn().mockResolvedValue({ insertedId: 7, message: 'Shared container saved.' }) };
        notifications = { push: jest.fn() };
        await TestBed.configureTestingModule({
            imports: [FormsModule],
            declarations: [SharedContainerEditorComponent],
            providers: [
                { provide: CoinageDataService, useValue: data },
                { provide: NotificationService, useValue: notifications },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(SharedContainerEditorComponent);
        component = fixture.componentInstance;
        component.container = container;
        component.ngOnChanges();
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    });

    it('discloses the historical impact and blocks saving until acknowledged', async () => {
        expect(fixture.nativeElement.textContent).toContain('Shared container changes affect historical items');
        expect(fixture.nativeElement.textContent).toContain('across all products');
        expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
        await component.save();
        expect(data.updateSharedContainer).not.toHaveBeenCalled();
        expect(component.correctHistoricalSizes).toBe(false);
    });

    it('edits a copy of the original and saves the same container after acknowledging', async () => {
        const draft = component.draft;
        if (!draft) throw new Error('No draft');
        draft.volume = 500;
        component.acknowledged = true;
        const saved = jest.spyOn(component.saved, 'emit');
        await component.save();
        expect(data.updateSharedContainer).toHaveBeenCalledWith(expect.objectContaining({ id: 7, volume: 500 }), false, true);
        expect(saved).toHaveBeenCalledWith(expect.objectContaining({ id: 7, volume: 500 }));
        expect(container.volume).toBe(330);
    });

    it('only sends the historical correction option when explicitly selected', async () => {
        component.correctHistoricalSizes = true;
        component.acknowledged = true;
        await component.save();
        expect(data.updateSharedContainer).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }), true, true);
    });

    it('resets acknowledgement when the user changes the historical correction option', async () => {
        const acknowledge: HTMLInputElement = fixture.nativeElement.querySelector('input[name="acknowledged"]');
        acknowledge.click();
        fixture.detectChanges();
        await fixture.whenStable();
        expect(component.acknowledged).toBe(true);
        const correctSizes: HTMLInputElement = fixture.nativeElement.querySelector('input[name="correctHistoricalSizes"]');
        correctSizes.click();
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        expect(component.correctHistoricalSizes).toBe(true);
        expect(component.acknowledged).toBe(false);
        expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
    });

    it('requires fresh acknowledgement when switching containers', async () => {
        component.acknowledged = true;
        component.correctHistoricalSizes = true;
        component.container = { ...container, id: 8 };
        component.ngOnChanges();
        expect(component.acknowledged).toBe(false);
        expect(component.correctHistoricalSizes).toBe(false);
        await component.save();
        expect(data.updateSharedContainer).not.toHaveBeenCalled();
    });

    it('cancels without saving or mutating the shared definition', () => {
        const cancelled = jest.spyOn(component.cancelled, 'emit');
        if (component.draft) component.draft.name = 'Unsaved';
        component.cancel();
        expect(cancelled).toHaveBeenCalled();
        expect(data.updateSharedContainer).not.toHaveBeenCalled();
        expect(container.name).toBe('Can');
    });

    it.each([{ volume: -1 }, { volumeUnit: 'g' }, { itemCount: 1.5 }, { itemCount: 2147483648 }, { name: 'a'.repeat(65) }])(
        'blocks invalid data: %p',
        async (patch) => {
            Object.assign(component.draft ?? {}, patch);
            component.acknowledged = true;
            await component.save();
            expect(data.updateSharedContainer).not.toHaveBeenCalled();
        },
    );

    it('saves on Enter without nesting or submitting the surrounding transfer form', () => {
        expect(fixture.nativeElement.querySelector('form')).toBeNull();
        expect(fixture.nativeElement.querySelector('button').type).toBe('button');
        const save = jest.spyOn(component, 'save').mockResolvedValue();
        const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
        fixture.nativeElement.querySelector('input[name="volume"]').dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
        expect(save).toHaveBeenCalledTimes(1);
    });

    it.each([{}, { error: 'Not saved' }])('retains edits and acknowledgement on failure: %p', async (response) => {
        data.updateSharedContainer.mockResolvedValue(response);
        component.acknowledged = true;
        await component.save();
        expect(component.error).toBeTruthy();
        expect(component.draft).toBeDefined();
        expect(component.saving).toBe(false);
        expect(component.acknowledged).toBe(true);
    });

    it('prevents duplicate submissions and cancelling a pending save', async () => {
        let finish: (result: { insertedId: number }) => void = () => undefined;
        data.updateSharedContainer.mockReturnValue(new Promise((resolve) => (finish = resolve)));
        component.acknowledged = true;
        const busy = jest.spyOn(component.busyChange, 'emit');
        const cancelled = jest.spyOn(component.cancelled, 'emit');
        const first = component.save();
        await component.save();
        component.cancel();
        expect(data.updateSharedContainer).toHaveBeenCalledTimes(1);
        expect(cancelled).not.toHaveBeenCalled();
        expect(busy).toHaveBeenCalledWith(true);
        finish({ insertedId: 7 });
        await first;
        expect(busy).toHaveBeenLastCalledWith(false);
    });
});
