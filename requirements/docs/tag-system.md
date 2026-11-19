# Tags on items, transfers, and receipts

## Review and interpretation

Tags are reusable, optional labels, independent of categories. Categories remain
single-valued and keep their existing hierarchy/type behavior. Tags have no
hierarchy or transfer type. The existing shared `tag` catalog (ID, unique name,
optional six-digit hex color) and existing `item_tag` table are reused.
Name uniqueness remains case-sensitive as in the existing schema; searching is
case-insensitive.

An item and a transfer can each have zero or more direct tag assignments. A tag
may be assigned to any number of items and transfers. Identity is the tag ID,
not object reference, display name, line count, quantity, or container.

### Set semantics

Let `D(t)` be the directly assigned tag IDs of transfer `t`, and `I(i)` the tag
IDs of catalog item `i`. Then:

```text
Inherited(t) = union(I(i) for every item line in t)
Effective(t) = D(t) union Inherited(t)
Effective(receipt) = union(Effective(t) for every transfer in receipt)
```

Membership and unions use `Set<number>`. JavaScript `Set<TagDTO>` alone is
insufficient: two objects with the same ID would still be different members.
TypeORM relations and JSON transport use arrays because neither supports a
native JSON Set. Those arrays represent sets, are deduplicated by ID, and tag
DTOs are ordered by name then ID for stable display. Composite primary keys
provide the same uniqueness at the database boundary.

### Direct and inherited provenance

Each effective transfer tag has the usual `id`, `name`, and `color`, plus:

| `isDirect` | `isInherited` | Meaning                                              |
| ---------- | ------------- | ---------------------------------------------------- |
| true       | false         | Stored on the transfer only.                         |
| false      | true          | Calculated from one or more of its catalog items.    |
| true       | true          | Both sources exist; still exactly one effective tag. |

There is no fourth state in an effective tag collection: a tag with neither
source is absent. Two flags are necessary; a single inherited flag would lose
the distinction needed to edit a tag that has both sources.

Receipt tags merge these flags across their transfers: `isDirect` means at least
one constituent transfer has a direct assignment; `isInherited` means at least
one constituent transfer inherits it from an item. Neither flag means the
receipt itself stores any assignment. The receipt UI clarifies that its tags
come from transfers/items.

### Lifecycle and edge cases

1. Assign a tag directly, then add an item with that tag: retain the direct
   assignment, display one tag with both flags.
2. Remove that direct assignment: remove only the `transfer_tag` row. The tag
   remains visible and searchable as inherited.
3. Remove a tag from one of several tagged items: it remains inherited while
   another item supplies it.
4. Remove the last supplying item, or remove its catalog tag: inheritance
   disappears immediately on the next read. Any direct assignment remains.
5. Change a catalog item's tags: all past and future transfers containing that
   item reflect the change. This is deliberately live classification, not a
   historical snapshot.
6. Repeated lines, quantities, containers, shared tags, or multiple matching
   transfers in a receipt never duplicate an effective tag.
7. Deleting a tag removes its assignment rows, not its items or transfers.
8. Duplicating a transfer carries its direct assignments through the existing
   duplication flow; item-derived tags remain derived.

## Persistence and migration

`tag` and `item_tag(item_id, tag_id)` already exist. The new additive migration
`1795046400000-AddTransferTags.ts` adds:

- `transfer_tag(transfer_id, tag_id)`, with a composite primary key.
- Cascading foreign keys for deleting transfers/tags.
- Reverse tag indexes on both junction tables for tag searches.
- A cascading `item_tag -> tag` foreign key, restoring deletion behavior changed
  to `NO ACTION` by the preceding schema-alignment migration.

No inherited flag, inherited assignment, receipt tag table, cache, backfill, or
propagation job is created. Reads calculate inheritance. No existing direct
assignment is removed when an item starts providing the same tag.

The migration's rollback drops the new junction/index and restores the previous
item-tag foreign-key policy. Rolling it back necessarily discards newly created
direct transfer assignments, but does not discard catalog tags or item tags.

## API contracts

- Existing tag CRUD and legacy item assign/unassign routes remain supported.
- Tag creation/update validates trimmed nonempty names (maximum 64 characters)
  and optional `#RRGGBB` colors. Duplicate names return HTTP 409.
- `POST /api/tags/items/:itemId` accepts `{ tagIds: number[] }` and replaces the
  item's direct tag set.
- `POST /api/tags/transfers/:transferId` accepts the same body and replaces only
  direct transfer assignments. This new route checks transfer ownership.
- Item save, full transfer save, and granular transfer save accept optional
  `tagIds`. Omission preserves existing assignments for older clients;
  `[]` explicitly clears them. IDs are validated and deduplicated.
- Advanced multi-transfer creation accepts optional `tagIds`; these are direct
  assignments on each created transfer. Item tags are inherited separately.
- Unknown/malformed tag IDs fail rather than silently dropping assignments.
- Transfer list, detail, recent, related-transfer, receipt-transfer, item-history, and global
  search DTOs expose effective tags and provenance.
- Item details, catalog/picker rows, container rows, and global search DTOs expose
  their direct tag sets.
- Receipt list, embedded receipt, and receipt details DTOs expose their union.

All assignment routes remain authenticated. Catalog and item scope follow the
existing shared-category/item model; this feature does not introduce private
per-user tags or change unrelated authorization policies.

## Searching

- Global search matches tag names case-insensitively and partially, in addition
  to existing item name/brand and transfer description matches.
- Transfer searches match either direct assignments or tags of their current
  items and retain source/target account restrictions.
- `GetFilteredTransfersRequest.tagIds` filters by any selected effective tag.
  This is OR within the tag selection and AND with other filter dimensions.
- Empty selections impose no restriction. Multiple matches return each transfer
  once, with consistent pagination and counts.
- Correlated `EXISTS` predicates keep filtering separate from eager loading:
  matching one tag must not trim other returned tags or item lines.
- Item table filtering applies the same any-selected-tag semantics to item
  tags. Unused catalog items are included in the list too.

## UI

- Reusable multi-select with inline tag creation for transfer forms, advanced
  transfer creation, and item details.
- Transfer editing initializes the selector from **direct** tags only.
- A deduplicated effective-tag preview reacts to adding/removing item lines and
  editing direct assignments. Item tags are never copied into the direct set.
- Item detail edits save independently, with loading/error feedback.
- Transfer and item tables expose tag filters; transfer filter state is cached,
  summarized, and clearable using the existing filter controls.
- Badges display effective transfer/receipt tags and direct item tags. Inherited
  badges have a visible marker and hover text explaining inheritance. When both
  sources exist, hover text explains why removing the direct assignment leaves
  the inherited tag.
- Global search results show tag badges, including inherited provenance.

## Verification

Automated coverage includes ID-based set union, overlapping sources, later item
addition, direct removal, item-tag/membership changes, receipt deduplication,
nonmutation of stored assignments, DTO validation, backward-compatible saves,
unknown-tag rejection, ownership on the new route, PostgreSQL query generation,
pagination/count predicates, eager loading, junction uniqueness/cascades,
migration SQL/rollback, UI previews, badges/tooltips, creation, and tag filters.

Before deployment, run the pending migration against the target PostgreSQL
database using `yarn migration:run`. Production startup also runs pending
migrations under the existing configuration. Back up the target database as
usual. Live migration/persistence verification requires a running PostgreSQL
instance; unit/query-generation tests do not replace that deployment check.
