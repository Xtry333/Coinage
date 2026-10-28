const RECEIPT_EXTRACTION_PROMPT_POLISH = `
ROLE: Polish Receipt Data Extraction Specialist.
TASK: Extract structured data from receipt text/OCR into a valid JSON object.

CONTEXT: Today's date is %today%. Use this as a reference when interpreting ambiguous or partial dates on the receipt (e.g. if only day/month visible, assume the most recent plausible year).

CONSTRAINTS & FORMATTING RULES:
1. OUTPUT FORMAT: Return ONLY valid JSON. No markdown, no explanations, no intro text.
2. LANGUAGE: All textual fields (name, contractor, description) MUST be in Polish (or English if they make sense). Correct obvious OCR errors (e.g. 'kośoś' -> correct contextually appropriate item name based on context/price/brand, or standardize to clear text).
3. DATE FORMAT: Parse date as ISO 'YYYY-MM-DD'. Prefer the payment/footer date (e.g., near barcode, QR code, or 'ROZLICZENIE PŁATNOŚCI'). If missing, use null (do not hallucinate).
4. AMOUNT: Extract the grand total as a plain number (no currency symbols). Look for any of these labels: 'SUMA PLN', 'Suma:', 'DO ZAPŁATY', 'RAZEM', 'ŁĄCZNIE', 'Kwota:'. Use the final total after all discounts.
5. CONTRACTOR: Extract the actual customer facing vendor/store name (e.g., "Biedronka", "Lidl", "Żabka"). Do NOT use document headers like "PARAGON FISKALNY" as the contractor name.
6. DESCRIPTION: Generate a short Polish summary of the receipt contents (max 50 characters) based on item names.
7. ITEMS ARRAY: Each item object must have 'name' (Polish string), 'price' (unit price as a number), and 'quantity' (number).
   - 'price' is ALWAYS the unit price (price per single unit or per kg/l), NOT the line total.
   - If only the line total is visible on the receipt, compute: price = (lineTotal - lineDiscount) / quantity.
   - For weighted items (e.g. "0.456 kg"), set quantity to the weight/volume value (e.g. 0.456) and price to the per-unit rate (e.g. price per kg).
   - Discount lines (e.g. 'RABAT', 'Opust', 'Promocja') are NOT separate items. Subtract the discount from the affected line total before computing the unit price for that item. Do not emit discount lines as items.
8. CONFIDENCE: Float between 0.0 and 1.0 reflecting overall extraction quality:
   - 0.95–1.0: Clear text, all fields readable, items sum matches total.
   - 0.75–0.94: Minor OCR noise or 1–2 ambiguous fields, overall data reliable.
   - 0.50–0.74: Noticeable OCR errors, partial fields, or items sum does not match total.
   - 0.00–0.49: Major portions unreadable, critical fields missing or unreliable.

SCHEMA:
{
  "date": "YYYY-MM-DD | null",
  "amount": <number | null>,
  "contractor": "<string | null>",
  "description": "<string | null (max 50 chars)>",
  "items": [
    {
      "name": "<Polish name>",
      "price": <unit price as number>,
      "quantity": <number>
    }
  ],
  "rawText": "<copy of the raw OCR input text, verbatim | null>",
  "confidence": <float 0.0-1.0>
}

INSTRUCTIONS FOR ITEM CORRECTION:
- If OCR yields typos (e.g., 'Antipasti' -> 'Antipasto'), fix them to Polish (or English) standards unless it creates a hallucination.
- Do not translate brand names or well-known product names that are commonly used in Poland, but correct obvious OCR errors that would make the name unrecognizable or nonsensical in Polish (or English) context.
- Uncompress item names from shortened forms if the context allows it (e.g., 'Nap' -> 'Napój').
- Do not guess prices for items that don't exist in the text.
- Round numbers only if strictly necessary by standard currency rules (2 decimals).

INPUT EXAMPLE CONTEXT (Internal Knowledge):
- Recognize patterns like 'F', 'I', 'X' next to price as VAT category flags, not quantity multipliers.
- Look for VAT labels (A/B/C/D,brak) but extract the gross amount at the end of the receipt.
- Identify footer text 'ROZLICZENIE PŁATNOŚCI' and dates near barcodes/QR codes.

OUTPUT REVISION: Before returning, verify:
  1. JSON is syntactically valid.
  2. Sum of (items[i].price × items[i].quantity) approximately equals 'amount' (within ±0.05 PLN rounding). If it does not match, lower 'confidence' accordingly.
`;

export function getReceiptExtractionPromptPolish(currentDate: string): string {
    return RECEIPT_EXTRACTION_PROMPT_POLISH.replace('%today%', currentDate);
}

export function getEntityMatchPrompt(query: string, candidates: Array<{ id: number; name: string; score: number }>, categoryNames: string[]): string {
    const categoryHint = categoryNames.length > 0 ? `\nAvailable product categories for context: ${categoryNames.join(', ')}.` : '';
    const candidateList = candidates.map((c) => `${c.id} | ${c.name}`).join('\n');

    return `You are a product/entity matching assistant for a Polish personal finance app.

Receipt OCR text (may be abbreviated or have OCR errors): "${query}"${categoryHint}

Database candidates (id | name):
${candidateList}

Task: Find which candidate best matches the receipt text. Consider:
- OCR truncations and abbreviations ("MLEKO UHT 3%" ≈ "Mleko UHT 3.2% 1L")
- Polish characters: accented vs plain (ó/o, ą/a, ę/e, ż/z, ś/s, ć/c, ł/l, ź/z, ń/n)
- Brand + product name reordering ("Ser Edam" ≈ "Edam ser żółty")
- Size/variant suffixes that may or may not be present
- Common OCR mistakes (0→O, 1→l, rn→m, ii→n)
- Only match if you are confident the receipt item IS that product (≥0.65)

Return ONLY valid JSON, no explanation, no markdown:
{"matchedId": <id number or null>, "confidence": <0.0–1.0>}

Return matchedId: null if no candidate is a sufficiently good match.`;
}

// ─── Batch entity matching prompt ────────────────────────────────────────────

export interface BatchItemEntry {
    /** Index in the original extracted items array. */
    index: number;
    /** OCR text from the receipt. */
    ocrName: string;
    /** Unit price from the receipt. */
    price: number;
    /** Quantity from the receipt. */
    quantity: number;
    /** Pre-computed fuzzy candidates for this item. */
    candidates: Array<{ id: number; name: string; score: number }>;
}

export interface BatchMatchResult {
    index: number;
    matchedId: number | null;
    confidence: number;
}

/**
 * Build a prompt that asks the AI to match multiple receipt items at once.
 *
 * Compared to the per-item `getEntityMatchPrompt`, this:
 * - Sends all items in a single request → fewer API calls
 * - Includes the contractor name → store-specific context
 * - Groups all candidates per item → AI can reason across items
 * - Optionally includes items previously purchased at this store
 *
 * The prompt is designed to use 10 000–20 000 tokens of context,
 * which is configurable via the candidate counts passed in.
 */
export function getBatchEntityMatchPrompt(
    items: BatchItemEntry[],
    contractorName: string | null,
    categoryNames: string[],
    contractorHistoryItemNames: string[],
): string {
    const contractorHint = contractorName ? `\nThis receipt is from: "${contractorName}".` : '';

    const categoryHint =
        categoryNames.length > 0 ? `\nAvailable product categories for context: ${categoryNames.join(', ')}.` : '';

    const historyHint =
        contractorHistoryItemNames.length > 0
            ? `\nItems previously purchased at this store (for context — these are likely matches if a receipt item looks similar):\n${contractorHistoryItemNames.map((n) => `  - ${n}`).join('\n')}`
            : '';

    const itemSections = items
        .map((item) => {
            const candidateList =
                item.candidates.length > 0
                    ? item.candidates.map((c) => `    ${c.id} | ${c.name}`).join('\n')
                    : '    (no candidates)';
            return `[Item ${item.index}] OCR: "${item.ocrName}" | price: ${item.price} | qty: ${item.quantity}
  Candidates:
${candidateList}`;
        })
        .join('\n\n');

    return `You are a product/entity matching assistant for a Polish personal finance app.
You are given a batch of items from a single receipt. Match each item to its best database candidate.${contractorHint}${categoryHint}${historyHint}

ITEMS TO MATCH:

${itemSections}

MATCHING RULES:
- OCR truncations and abbreviations ("MLEKO UHT 3%" ≈ "Mleko UHT 3.2% 1L")
- Polish characters: accented vs plain (ó/o, ą/a, ę/e, ż/z, ś/s, ć/c, ł/l, ź/z, ń/n)
- Brand + product name reordering ("Ser Edam" ≈ "Edam ser żółty")
- Size/variant suffixes that may or may not be present
- Common OCR mistakes (0→O, 1→l, rn→m, ii→n)
- Use the store name, other items on the receipt, and purchase history as context clues
- Only match if you are confident the receipt item IS that product (confidence ≥ 0.65)
- Each item's matchedId MUST be one of the candidate IDs listed for that item, or null

Return ONLY valid JSON, no explanation, no markdown:
{"items": [{"index": <number>, "matchedId": <id or null>, "confidence": <0.0-1.0>}]}

Return one entry per item. Preserve the index values exactly as given.`;
}
