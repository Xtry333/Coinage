import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { lastValueFrom } from 'rxjs';

import { TagDTO, uniqueTags } from '@app/interfaces';

import { CoinageDataService } from '../../services/coinage.data-service';

@Component({
    selector: 'app-tag-selector',
    templateUrl: './tag-selector.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
})
export class TagSelectorComponent implements OnInit {
    @Input() public tagIds: number[] | undefined = [];
    @Input() public disabled = false;
    @Input() public inputId = 'tags';
    @Output() public tagIdsChange = new EventEmitter<number[]>();
    @Output() public tagsLoaded = new EventEmitter<TagDTO[]>();

    public tags: TagDTO[] = [];
    public loading = true;
    public error = '';
    public loadFailed = false;

    public constructor(private readonly dataService: CoinageDataService) {}

    public async ngOnInit(): Promise<void> {
        try {
            this.tags = uniqueTags(await lastValueFrom(this.dataService.getTags()));
            this.tagsLoaded.emit(this.tags);
        } catch {
            this.loadFailed = true;
            this.error = 'Could not load tags. Reload the page to try again.';
        } finally {
            this.loading = false;
        }
    }

    public onChange(ids: number[] | null): void {
        this.tagIdsChange.emit([...new Set(ids ?? [])]);
    }

    public async addTag(name: string): Promise<TagDTO> {
        const trimmed = name.trim();
        const existing = this.tags.find((tag) => tag.name === trimmed);
        if (existing) return existing;
        this.error = '';
        try {
            const response = await this.dataService.saveTag({ name: trimmed });
            if (!response.insertedId || response.error) throw new Error('Tag not saved');
            const tag = { id: response.insertedId, name: trimmed, color: null };
            this.tags = uniqueTags([...this.tags, tag]);
            this.tagsLoaded.emit(this.tags);
            return tag;
        } catch (error) {
            this.error = 'Could not create tag. Use a unique name of 1–64 characters.';
            throw error;
        }
    }
}
