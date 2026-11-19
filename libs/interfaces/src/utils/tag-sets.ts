import { EffectiveTagDTO, TagDTO } from '../lib/TagDTO.response';

/** JSON and TypeORM use arrays; all membership and unions use sets of tag IDs. */
export function uniqueTags(tags: readonly TagDTO[] = []): TagDTO[] {
    const ids = new Set<number>();
    const unique: TagDTO[] = [];
    for (const tag of tags) {
        if (ids.has(tag.id)) continue;
        ids.add(tag.id);
        unique.push({ id: tag.id, name: tag.name, color: tag.color });
    }
    return unique.sort(compareTags);
}

export function effectiveTags(directTags: readonly TagDTO[] = [], itemTags: readonly (readonly TagDTO[])[] = []): EffectiveTagDTO[] {
    const directIds = new Set(directTags.map((tag) => tag.id));
    const inherited = itemTags.flat();
    const inheritedIds = new Set(inherited.map((tag) => tag.id));
    return uniqueTags([...directTags, ...inherited]).map((tag) => ({
        ...tag,
        isDirect: directIds.has(tag.id),
        isInherited: inheritedIds.has(tag.id),
    }));
}

/** Receipt flags describe sources on its transfers, not assignments to the receipt. */
export function unionEffectiveTags(groups: readonly (readonly EffectiveTagDTO[])[]): EffectiveTagDTO[] {
    const tags = groups.flat();
    const direct = tags.filter((tag) => tag.isDirect);
    const inherited = tags.filter((tag) => tag.isInherited);
    return effectiveTags(direct, [inherited]);
}

function compareTags(a: TagDTO, b: TagDTO): number {
    return a.name.localeCompare(b.name) || a.id - b.id;
}
