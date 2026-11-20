import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';

import { ItemPackagingDTO, packagingLabel } from '@app/interfaces';

import { CoinageDataService } from '../../services/coinage.data-service';

@Component({
    selector: 'app-packaging-selector',
    templateUrl: './packaging-selector.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
})
export class PackagingSelectorComponent implements OnChanges, OnDestroy {
    @Input() public itemId?: number;
    @Input() public packagingId?: number | null;
    @Input() public legacyContainerId?: number | null;
    @Input() public autoSelectPreferred = false;
    @Output() public packagingChange = new EventEmitter<ItemPackagingDTO | null>();
    public variants: (ItemPackagingDTO & { displayName: string })[] = [];
    public loading = false;
    public error = '';
    public adding = false;
    private generation = 0;

    public constructor(private readonly data: CoinageDataService) {}

    public ngOnChanges(): void {
        this.adding = false;
        void this.load();
    }

    public ngOnDestroy(): void {
        this.generation++;
    }

    public async load(): Promise<void> {
        const generation = ++this.generation;
        this.variants = [];
        this.error = '';
        this.loading = false;
        if (!this.itemId) return;
        this.loading = true;
        try {
            const variants = await this.data.getItemPackaging(this.itemId);
            if (generation !== this.generation) return;
            this.variants = variants
                .filter((p) => !p.isArchived || p.id === this.packagingId)
                .map((p) => ({ ...p, displayName: `${packagingLabel(p)}${p.isArchived ? ' (archived)' : p.isPreferred ? ' (preferred)' : ''}` }));
            if (this.packagingId === undefined) {
                // A shared format alone cannot identify a product's historical size.
                const selected = !this.legacyContainerId && this.autoSelectPreferred ? this.variants.find((p) => p.isPreferred) : undefined;
                if (selected) this.select(selected.id);
            }
        } catch {
            if (generation === this.generation) this.error = 'Could not load packaging.';
        } finally {
            if (generation === this.generation) this.loading = false;
        }
    }

    public select(id: number | null): void {
        this.packagingId = id;
        this.packagingChange.emit(this.variants.find((p) => p.id === id) ?? null);
    }

    public onCreated(packaging: ItemPackagingDTO): void {
        if (packaging.itemId !== this.itemId) return;
        this.packagingId = packaging.id;
        this.packagingChange.emit(packaging);
        this.adding = false;
        void this.load();
    }
}
