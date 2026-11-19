import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { EffectiveTagDTO, TagDTO } from '@app/interfaces';

@Component({
    selector: 'app-tag-badges',
    templateUrl: './tag-badges.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class TagBadgesComponent {
    @Input() public tags: readonly (TagDTO | EffectiveTagDTO)[] | null | undefined = [];
    @Input() public receipt = false;

    public get displayedTags(): (TagDTO | EffectiveTagDTO)[] {
        const seen = new Set<number>();
        return (this.tags ?? []).filter((tag) => {
            if (seen.has(tag.id)) return false;
            seen.add(tag.id);
            return true;
        });
    }

    public isInherited(tag: TagDTO | EffectiveTagDTO): boolean {
        return 'isInherited' in tag && tag.isInherited;
    }

    public title(tag: TagDTO | EffectiveTagDTO): string {
        if (this.isInherited(tag)) {
            return 'isDirect' in tag && tag.isDirect
                ? 'Assigned directly to a transfer and also inherited from items. Removing the direct assignment leaves the inherited tag.'
                : 'Inherited from items, calculated automatically. Edit the item tags to remove this tag.';
        }
        return this.receipt ? 'Assigned to a transfer in this receipt.' : 'Directly assigned tag.';
    }
}
