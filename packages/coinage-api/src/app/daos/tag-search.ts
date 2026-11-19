/**
 * Correlated EXISTS keeps tag filtering separate from eager relation loading:
 * matching one tag must not truncate the tags/items returned in a DTO or multiply rows.
 * All values in tagCondition must be bound parameters, never interpolated user input.
 */
export function transferTagExistsCondition(transferIdExpression: string, tagCondition: string): string {
    return `(
        EXISTS (
            SELECT 1 FROM transfer_tag search_transfer_tag
            JOIN tag search_tag ON search_tag.id = search_transfer_tag.tag_id
            WHERE search_transfer_tag.transfer_id = ${transferIdExpression} AND ${tagCondition}
        )
        OR EXISTS (
            SELECT 1 FROM transfer_item search_transfer_item
            JOIN item_tag search_item_tag ON search_item_tag.item_id = search_transfer_item.item_id
            JOIN tag search_tag ON search_tag.id = search_item_tag.tag_id
            WHERE search_transfer_item.transfer_id = ${transferIdExpression} AND ${tagCondition}
        )
    )`;
}
