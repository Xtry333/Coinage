# Product packaging variants

`item_packaging` owns each package's name, optional barcode, and preferred/archive status. A package is either a leaf with stored net contents, or an outer package containing a specific version of another package of the same product. The existing `Container` entity and optional FK are retained for legacy compatibility; they do not supply new packaging names.

## Usage

- Open an item's **Edit** page and use **Packaging variants** to add, duplicate, replace, correct, prefer, or archive a size.
- New purchases can default to the preferred variant. Selecting no packaging records a loose/unspecified item.
- Transfer and receipt editors offer only that product's variants, with **Add another size** available inline.
- Packaging changes are saved separately from the surrounding item/transfer form. Cancelling that form does not undo packaging changes.
- Leaf measurements are **net contents of that package**, not physical container weight. Outer packages have no manually stored totals: weight, volume, and individual-item count are derived recursively from the contained package.
- Replacing a size creates a new variant and archives the old one. Historical purchases keep the original measurements. Archived variants remain visible on purchases already using them.
- Purchase lines are identified by their line ID. Repeated lines for the same product, package, and price retain their own quantities and discounts.
- Receipt matching compares total net contents in compatible units (`24 × 250 ml` matches a 6 l box of 24). Explicit sizes/counts take priority over price guesses; mismatched sizes require a selection.
- Price comparisons use the selected package's contents. Loose purchases and packages without measurements do not inherit deprecated item-level sizes.
- Stored leaf counts and contained-package counts must be integers from 1 to 2147483647. Derived total item counts may be larger, up to JavaScript's safe integer limit.

### Box of 24 cans

1. Create **Can** with volume **0.25 l** (and optionally item count **1**). No legacy container reference is required.
2. Create **Box**, select **Can** as its contained packaging, and enter contained count **24**. The calculated total is **6 l**, **24 individual items**, **0.25 l per item**.
3. A purchase of one box has transfer quantity **1** and the whole-box price. Buying two boxes means quantity **2**.
4. **Pallet** can contain **10 × Box**, deriving **60 l** and **240 cans**.

Containment uses a same-product self-FK. API validation and database constraints/triggers prevent missing/non-positive counts, cross-product links, direct/indirect cycles, manual outer totals, and nesting beyond 32 levels. Referenced packages cannot be deleted; archiving is supported.

Parents remain pinned to the chosen inner version. Replacing Can with a new 0.3 l version does not change an existing Box's 6 l total. Edit/replace Box explicitly to choose the new Can; historical purchases keep the old Box → Can chain.

### Correcting an existing package

- **Edit package** still archives the old variant and creates a replacement by default.
- To rename a package or fix an incorrect size without creating a new version, select **Correct existing package instead of archiving and replacing it**, then acknowledge the historical impact and **Save correction**.
- For old versions, enable **Show archived sizes** and choose **Correct archived package**. These corrections also require acknowledgment and leave the package archived and non-preferred.
- Corrections keep the same package ID. Past purchases and all packages containing that version reflect the corrected name and contents; purchase prices and quantities, other products, and shared container definitions are unchanged.
- The API requires both `correctExistingPackaging: true` and `acknowledgeHistoricalImpact: true` on `PUT /items/:itemId/packaging/:id`. Without correction mode, replacement behavior is unchanged. Corrections also validate affected outer packages for cycles, nesting limits, and unsafe totals.
- No additional database migration is needed.

### Editing shared / legacy containers

Use **Edit shared container** beside a packaging variant, or **Manage shared / legacy containers** beneath the packaging list to select any original definition, including unused containers. This is deliberately separate from product-specific **Edit package**.

- Shared names change only on records displaying the legacy container name. Named packaging variants keep their own names. Legacy purchases without packaging snapshots also read the updated container measurements.
- Saving requires acknowledging the historical impact. By default, saved product-packaging sizes remain unchanged.
- **Also correct matching historical sizes** is an explicit retroactive correction. It updates linked **leaf** variants whose complete previous weight, volume, units, and pack count match the old container definition, including archived variants across products. Outer totals automatically reflect corrections to their referenced leaves. Independently defined leaf sizes remain untouched.
- Historical price-per-weight/volume displays can change after a correction; purchase prices and quantities are never changed.
- The shared definition and any matching leaf-size corrections are saved atomically.

## Migration and compatibility

Back up the database, then run `yarn migration:run` before starting the updated development API. Production runs pending migrations on startup.

`1795175999000-NormalizeMeasurementUnits.ts` lowercases and trims all stored unit symbols (`L` → `l`, `KG` → `kg`, `ML` → `ml`, `CL` → `cl`, `G` → `g`) in legacy items, shared containers, and existing packaging snapshots, including archived variants. Numeric values, names, and currencies are unchanged. It runs before the packaging backfill on fresh upgrades so uppercase legacy sizes are recognized, and also handles databases where packaging is already installed. Its rollback intentionally keeps the normalized units, since original casing cannot be reconstructed.

`1795176000000-AddItemPackaging.ts` copies existing product/container pairs and deprecated per-product sizes into product-specific variants and links historical purchases. Legacy fields are retained. The most recently purchased variant becomes preferred.

`1795176001000-AddPackagingComposition.ts` adds independent packaging names, contained-package/count fields, same-product referential integrity, cycle/depth guards, and the recursive `item_packaging_contents` view. Existing container names are copied into package names once, with an ID-based fallback for unnamed packages. All existing measurements and flat multipack counts are preserved: the migration does not guess which historical packages contain other packages.

Older clients sending only `containerId` remain supported: the API resolves or creates an exact product-specific snapshot. Price-per-liter/kilogram calculations and receipt matching use variant measurements, not mutable shared-container sizes.

This migration is intentionally forward-only: the old shared-container model cannot represent the new product catalog losslessly. Rollback requires restoring a backup.

## Verification

Run the API and webapp test/typecheck targets through Nx. The PostgreSQL integration suite can be opted into with `COINAGE_PACKAGING_DB_TEST=1`:

```powershell
$env:COINAGE_PACKAGING_DB_TEST = '1'
$env:NODE_OPTIONS = '--require dotenv/config'
yarn nx test coinage-api --runInBand --testPathPatterns="item-packaging.integration|NormalizeMeasurementUnits" --skipNxCache
```

The integration suite uses a disposable schema inside a transaction and always rolls it back; application tables are not modified.
