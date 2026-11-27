# Signed item prices and transfer direction

- `Item.kindCode` references `item_kind`. Existing and newly created items default to `PRODUCT`; the initial reference values also include `DEPOSIT` and `ADJUSTMENT`. Kind is classification only: **every kind permits negative line prices**.
- Quantities and whole-line discounts remain nonnegative. Unit prices and stored gross line totals may be negative. A line's net amount is `totalSetPrice - totalSetDiscount`.
- Transfer `amount` must be nonnegative; zero transfers retain offsetting item lines. Negative amounts are rejected by request validation, the service/DAO save boundaries and the database constraint. Saving never swaps accounts or takes the absolute value of a negative amount.
- Item signs are preserved exactly. Money direction is determined by explicitly chosen `originAccount` and `targetAccount`, not by changing item signs or storing orientation metadata.
- The editor displays the signed item subtotal and keeps auto-calculated totals signed. A negative transfer amount blocks saving with an error. Manual transfer-total overrides remain supported.
- Receipt confirmation and advanced entry still split lines by category. All resulting category totals are checked before creating any transfers; a negative group is rejected even when the receipt-wide total is positive. Charges and credits in a nonnegative group remain signed, including groups that net to zero.
- A full-transfer refund is a new positive transfer with reversed accounts, the same currency and owner, and a link to the original. It does not negate the original transfer or rewrite its item prices.
- Receipt totals remain signed (positive expense, negative credit). Reconciliation, balances and category spending use account ownership/direction, not category type alone.
- Transfer-specific API fields are `originAccount`, `originAccountId` and `originAccountName`; the corresponding database column is `transfer.origin_account_id`. Account resources, balance DTOs and filters that match either account keep their existing names.

## Deployment

Apply `1795776000000-SignedItemPrices` with the application's normal migration workflow before using the new server. It adds reference kinds, renames the origin-account column and enforces nonnegative transfer amounts. If legacy negative transfers exist, the migration fails: correct them explicitly before retrying; it does not rewrite amounts or accounts. Deploy the matching web app because the transfer API field rename is breaking.

Item kinds do not define a product/deposit relationship. This change does not infer bottle counts from names or enforce a deposit-to-bottle rule; that requires an explicit relationship. Category splitting remains unchanged.

The PostgreSQL regression suite can be enabled with `COINAGE_SIGNED_ITEMS_DB_TEST=1` when running `yarn nx run coinage-api:test`. It only uses a temporary schema inside a rolled-back transaction.
