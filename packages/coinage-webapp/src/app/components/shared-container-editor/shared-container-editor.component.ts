import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';

import { ContainerDTO } from '@app/interfaces';

import { CoinageDataService } from '../../services/coinage.data-service';
import { NotificationService } from '../../services/notification.service';

let nextEditorId = 0;

@Component({
    selector: 'app-shared-container-editor',
    templateUrl: './shared-container-editor.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
})
export class SharedContainerEditorComponent implements OnChanges, OnDestroy {
    @Input() public container?: ContainerDTO;
    @Output() public saved = new EventEmitter<ContainerDTO>();
    @Output() public cancelled = new EventEmitter<void>();
    @Output() public busyChange = new EventEmitter<boolean>();

    public draft?: ContainerDTO;
    public acknowledged = false;
    public correctHistoricalSizes = false;
    public saving = false;
    public error = '';
    public readonly formId = `shared-container-${nextEditorId++}`;
    private generation = 0;

    public constructor(
        private readonly data: CoinageDataService,
        private readonly notifications: NotificationService,
    ) {}

    public ngOnChanges(): void {
        this.generation++;
        this.draft = this.container ? { ...this.container } : undefined;
        this.acknowledged = false;
        this.correctHistoricalSizes = false;
        this.error = '';
    }

    public ngOnDestroy(): void {
        this.generation++;
    }

    public get valid(): boolean {
        const p = this.draft;
        if (!p) return false;
        const validSize = (value: number | null, unit: string | null, units: string[]) =>
            (value == null && unit == null) || (typeof value === 'number' && Number.isFinite(value) && value > 0 && unit != null && units.includes(unit));
        return (
            (p.name?.trim().length ?? 0) <= 64 &&
            validSize(p.weight, p.weightUnit, ['g', 'kg']) &&
            validSize(p.volume, p.volumeUnit, ['ml', 'cl', 'l']) &&
            (p.itemCount == null || (Number.isSafeInteger(p.itemCount) && p.itemCount > 0 && p.itemCount <= 2147483647))
        );
    }

    public async save(): Promise<void> {
        if (this.saving || !this.acknowledged || !this.valid || !this.draft) return;
        const generation = this.generation;
        const request = { ...this.draft, name: this.draft.name?.trim() || null };
        this.saving = true;
        this.busyChange.emit(true);
        this.error = '';
        try {
            const response = await this.data.updateSharedContainer(request, this.correctHistoricalSizes, true);
            if (response.error || response.insertedId !== request.id) throw new Error('Container not saved');
            if (generation !== this.generation) return;
            this.notifications.push({ title: 'Shared Container Saved', message: response.message ?? 'Shared changes apply to historical items too.' });
            this.saving = false;
            this.busyChange.emit(false);
            this.saved.emit(request);
        } catch {
            if (generation === this.generation) this.error = 'Could not save the shared container. Your changes are still here; please retry.';
        } finally {
            if (this.saving) {
                this.saving = false;
                this.busyChange.emit(false);
            }
        }
    }

    public cancel(): void {
        if (!this.saving) this.cancelled.emit();
    }

    public onEnter(event: Event): void {
        if (!(event.target instanceof HTMLInputElement)) return;
        event.preventDefault();
        event.stopPropagation();
        void this.save();
    }
}
