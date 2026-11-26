import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { lastValueFrom } from 'rxjs';

import {
    calculatePackagingContents,
    ContainerDTO,
    ItemPackagingDTO,
    ItemPackagingInput,
    PackagingContents,
    packagingLabel,
    packagingPerItemLabel,
} from '@app/interfaces';

import { CoinageDataService } from '../../services/coinage.data-service';
import { NotificationService } from '../../services/notification.service';

let nextFormId = 0;

@Component({
    selector: 'app-item-packaging',
    templateUrl: './item-packaging.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
})
export class ItemPackagingComponent implements OnChanges, OnDestroy {
    @Input() public itemId!: number;
    @Input() public readonly = false;
    @Input() public startAdding = false;
    @Output() public saved = new EventEmitter<ItemPackagingDTO>();

    public variants: ItemPackagingDTO[] = [];
    public containers: ContainerDTO[] = [];
    public loading = true;
    public saving = false;
    public error = '';
    public showArchived = false;
    public draft?: ItemPackagingInput;
    public replacedId?: number;
    public correctExistingPackaging = false;
    public correctionAcknowledged = false;
    public showContainerManager = false;
    public editingContainerId: number | null = null;
    public readonly formId = `packaging-form-${nextFormId++}`;
    public readonly label = packagingLabel;
    public readonly perItemLabel = packagingPerItemLabel;
    private generation = 0;
    private context = 0;

    public constructor(
        private readonly data: CoinageDataService,
        private readonly notifications: NotificationService,
    ) {}

    public ngOnChanges(): void {
        this.context++;
        this.draft = undefined;
        this.replacedId = undefined;
        this.correctExistingPackaging = false;
        this.correctionAcknowledged = false;
        this.showContainerManager = false;
        this.editingContainerId = null;
        this.variants = [];
        void this.load();
        if (this.startAdding) this.start();
    }

    public ngOnDestroy(): void {
        this.generation++;
        this.context++;
    }

    public async load(): Promise<void> {
        const generation = ++this.generation;
        this.loading = true;
        this.error = '';
        try {
            const [variants, containers] = await Promise.all([this.data.getItemPackaging(this.itemId), lastValueFrom(this.data.getContainerList())]);
            if (generation !== this.generation) return;
            this.variants = variants;
            this.containers = containers;
        } catch {
            if (generation === this.generation) this.error = 'Could not load packaging. Please retry.';
        } finally {
            if (generation === this.generation) this.loading = false;
        }
    }

    public start(variant?: ItemPackagingDTO, replace = false): void {
        if (this.saving) return;
        this.showContainerManager = false;
        this.editingContainerId = null;
        this.replacedId = replace ? variant?.id : undefined;
        this.correctExistingPackaging = replace && variant?.isArchived === true;
        this.correctionAcknowledged = false;
        this.draft = {
            name: variant?.name || variant?.containerName || '',
            containedPackagingId: variant?.containedPackagingId ?? null,
            containedCount: variant?.containedCount ?? null,
            containerId: variant?.containerId ?? null,
            weight: variant?.containedPackagingId ? null : (variant?.weight ?? null),
            weightUnit: variant?.containedPackagingId ? null : (variant?.weightUnit ?? null),
            volume: variant?.containedPackagingId ? null : (variant?.volume ?? null),
            volumeUnit: variant?.containedPackagingId ? null : (variant?.volumeUnit ?? null),
            itemCount: variant?.containedPackagingId ? null : (variant?.itemCount ?? null),
            barcode: replace ? (variant?.barcode ?? null) : null,
            isPreferred: replace ? (variant?.isPreferred ?? false) : false,
        };
    }

    public get editingArchived(): boolean {
        return this.variants.some((variant) => variant.id === this.replacedId && variant.isArchived);
    }

    public get containedOptions(): (ItemPackagingDTO & { displayName: string })[] {
        const byId = new Map(this.variants.map((p) => [p.id, p]));
        return this.variants
            .filter((p) => {
                if (p.isArchived && p.id !== this.draft?.containedPackagingId) return false;
                if ((p.nestingDepth ?? 1) >= 32) return false;
                const seen = new Set<number>();
                let current: ItemPackagingDTO | undefined = p;
                while (current) {
                    if (current.id === this.replacedId || seen.has(current.id)) return false;
                    seen.add(current.id);
                    current = current.containedPackagingId != null ? byId.get(current.containedPackagingId) : undefined;
                }
                return true;
            })
            .map((p) => ({ ...p, displayName: `${packagingLabel(p)}${p.isArchived ? ' (archived version)' : ''}` }));
    }

    public onContainedPackagingChanged(id: number | null): void {
        if (!this.draft) return;
        Object.assign(this.draft, {
            containedPackagingId: id ?? null,
            containedCount: id == null ? null : 1,
            weight: null,
            weightUnit: null,
            volume: null,
            volumeUnit: null,
            itemCount: null,
        });
    }

    public get calculatedContents(): PackagingContents | undefined {
        if (!this.draft) return undefined;
        try {
            return calculatePackagingContents(this.draft, new Map(this.variants.map((p) => [p.id, p])));
        } catch {
            return undefined;
        }
    }

    public get draftSummary(): string {
        if (!this.draft || !this.calculatedContents) return '';
        const contained = this.variants.find((p) => p.id === this.draft?.containedPackagingId);
        return packagingLabel({ ...this.draft, ...this.calculatedContents, containedPackagingName: contained?.name || contained?.containerName });
    }

    public get draftPerItem(): string {
        return this.draft && this.calculatedContents ? packagingPerItemLabel({ ...this.draft, ...this.calculatedContents }) : '';
    }

    public get editingContainer(): ContainerDTO | undefined {
        return this.containers.find((container) => container.id === this.editingContainerId);
    }

    public containerLabel(container: ContainerDTO): string {
        return `${container.id} · ${packagingLabel({ ...container, containerId: container.id, containerName: container.name, barcode: null })}`;
    }

    public editSharedContainer(id: number): void {
        if (this.saving) return;
        this.draft = undefined;
        this.showContainerManager = true;
        this.editingContainerId = id;
    }

    public async onSharedContainerSaved(): Promise<void> {
        this.editingContainerId = null;
        await this.load();
    }

    public get valid(): boolean {
        const p = this.draft;
        if (!p) return false;
        if (!p.name?.trim() || p.name.trim().length > 64 || (p.barcode?.length ?? 0) > 64) return false;
        if (p.containedPackagingId != null) {
            return (
                this.containedOptions.some((child) => child.id === p.containedPackagingId) &&
                this.calculatedContents != null &&
                [p.weight, p.weightUnit, p.volume, p.volumeUnit, p.itemCount].every((value) => value == null)
            );
        }
        if (p.containedCount != null) return false;
        const validSize = (value: number | null, unit: string | null, units: string[]) =>
            (value == null && unit == null) || (typeof value === 'number' && Number.isFinite(value) && value > 0 && unit != null && units.includes(unit));
        return (
            validSize(p.weight, p.weightUnit, ['g', 'kg']) &&
            validSize(p.volume, p.volumeUnit, ['ml', 'cl', 'l']) &&
            (p.itemCount == null || (Number.isSafeInteger(p.itemCount) && p.itemCount > 0 && p.itemCount <= 2147483647)) &&
            (p.barcode?.length ?? 0) <= 64
        );
    }

    public async addContainer(name: string): Promise<ContainerDTO> {
        const trimmed = name.trim();
        if (!trimmed || trimmed.length > 64) throw new Error('Container name must be 1–64 characters.');
        const existing = this.containers.find((c) => c.name?.toLowerCase() === trimmed.toLowerCase());
        if (existing) return existing;
        try {
            const container = await this.data.createContainerFormat(trimmed);
            this.containers = [...this.containers, container];
            return container;
        } catch (error) {
            this.notifications.error('Could not create container format.');
            throw error;
        }
    }

    public async save(): Promise<void> {
        if (this.saving || this.loading || this.error || !this.valid || !this.draft) return;
        if (this.correctExistingPackaging && (!this.replacedId || !this.correctionAcknowledged)) return;
        const context = this.context;
        const correcting = this.correctExistingPackaging;
        this.saving = true;
        try {
            const saved = await this.data.saveItemPackaging(
                this.itemId,
                { ...this.draft, ...(correcting ? { correctExistingPackaging: true, acknowledgeHistoricalImpact: true } : {}) },
                this.replacedId,
            );
            if (context !== this.context) return;
            this.draft = undefined;
            this.replacedId = undefined;
            this.correctExistingPackaging = false;
            this.correctionAcknowledged = false;
            await this.load();
            if (context !== this.context) return;
            this.notifications.push({
                title: 'Packaging Saved',
                message: correcting
                    ? 'Existing purchases and containing packages now use the corrected packaging.'
                    : 'Existing purchases retain their original sizes.',
            });
            this.saved.emit(saved);
        } catch {
            if (context === this.context) this.notifications.error('Could not save packaging. Please try again.');
        } finally {
            this.saving = false;
        }
    }

    public async setState(variant: ItemPackagingDTO, action: 'prefer' | 'archive'): Promise<void> {
        if (this.saving) return;
        const context = this.context;
        this.saving = true;
        try {
            await this.data.setItemPackagingState(this.itemId, variant.id, action);
            if (context !== this.context) return;
            await this.load();
        } catch {
            if (context === this.context) this.notifications.error('Could not update packaging.');
        } finally {
            this.saving = false;
        }
    }

    public onEnter(event: Event): void {
        if (!(event.target instanceof HTMLInputElement)) return;
        event.preventDefault();
        event.stopPropagation();
        void this.save();
    }
}
