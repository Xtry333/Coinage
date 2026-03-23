import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { CategoryDao } from '../../daos/category.dao';
import { ContractorDao } from '../../daos/contractor.dao';
import { ItemDao } from '../../daos/item.dao';
import { ItemsWithContainersDao } from '../../daos/itemsWithContainers.dao';
import { Category, TransferTypeEnum } from '../../entities/Category.entity';
import { Container } from '../../entities/Container.entity';
import { Contractor } from '../../entities/Contractor.entity';
import { Item } from '../../entities/Item.entity';
import { ItemsWithContainers } from '../../entities/views/ItemsWithContainers.view';
import { OllamaExtractedData, OllamaService } from './ollama.service';

/** Top N fuzzy candidates to send to AI on first attempt. */
const FIRST_PASS_CANDIDATES = 10;
/** Top N fuzzy candidates to send to AI on retry. */
const RETRY_PASS_CANDIDATES = 50;
/** Score above which the fuzzy match is accepted without an AI call. */
const AUTO_MATCH_THRESHOLD = 0.96;
/** Minimum AI confidence to accept a match. */
const AI_CONFIDENCE_THRESHOLD = 0.65;
/** Minimum fuzzy score to include a candidate at all. */
const MINIMUM_FUZZY_SCORE = 0.5;
/**
 * If the last recorded unit price for a container is within this fraction of
 * the current receipt price, it is considered a price match.
 * e.g. 0.20 means ±20% tolerance.
 */
const PRICE_MATCH_TOLERANCE = 0.2;

// ─── Public interfaces ────────────────────────────────────────────────────────

export interface SuggestedContainer {
    id: number;
    name: string | null;
    volume: number | null;
    volumeUnit: string | null;
    weight: number | null;
    weightUnit: string | null;
    itemCount: number | null;
    /** Last recorded unit price for this item+container pair (for display/comparison). */
    lastUnitPrice: number | null;
}

export type ContainerConfidence =
    | 'auto-single' // Only one container ever used with this item
    | 'price-match' // Selected because its last price is closest to current receipt price
    | 'dimension-match' // Parsed volume/weight from OCR name matched an existing container
    | 'none'; // Could not determine — user must pick

export interface NormalizedItem {
    /** null means no existing item matched — a new Item should be created on confirmation. */
    itemId: number | null;
    isNew: boolean;
    name: string;
    brand: string | null;
    categoryId: number | null;
    price: number;
    quantity: number;
    /** Best guessed container, or null if we could not determine one. */
    suggestedContainer: SuggestedContainer | null;
    /**
     * All containers historically used with this item.
     * Frontend should display these as a dropdown for user confirmation.
     */
    historicalContainers: SuggestedContainer[];
    containerConfidence: ContainerConfidence;
    /** Frontend should always show the container picker when this is true. */
    needsContainerConfirmation: boolean;
}

export interface NormalizedReceiptData {
    date?: string | null;
    amount?: number | null;
    /** null means no existing contractor matched. */
    contractorId: number | null;
    contractorName: string | null;
    isNewContractor: boolean;
    description?: string | null;
    items: NormalizedItem[];
    /** The raw AI extraction, preserved for debugging and display. */
    rawExtracted: OllamaExtractedData;
}

// ─── Internal types ───────────────────────────────────────────────────────────

interface FuzzyCandidate {
    id: number;
    name: string;
    score: number;
}

interface ParsedDimensions {
    volume?: number;
    volumeUnit?: string;
    weight?: number;
    weightUnit?: string;
    itemCount?: number;
}

interface ContainerWithPrice {
    containerId: number;
    lastUnitPrice: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ReceiptNormalizationService {
    private readonly logger = new Logger(ReceiptNormalizationService.name);

    public constructor(
        private readonly categoryDao: CategoryDao,
        private readonly contractorDao: ContractorDao,
        private readonly itemDao: ItemDao,
        private readonly itemsWithContainersDao: ItemsWithContainersDao,
        private readonly ollamaService: OllamaService,
        @InjectDataSource() private readonly dataSource: DataSource,
    ) {}

    public async normalize(rawData: OllamaExtractedData): Promise<NormalizedReceiptData> {
        const [categories, contractors, items] = await Promise.all([this.categoryDao.getAll(), this.contractorDao.getActive(), this.itemDao.getAll()]);

        // Only use OUTCOME categories for receipt items (purchases)
        const outcomeCategories = categories.filter((c) => c.type === TransferTypeEnum.OUTCOME);

        const [contractorId, contractorName, isNewContractor] = await this.resolveContractor(rawData.contractor ?? null, contractors);

        const normalizedItems = await Promise.all((rawData.items ?? []).map((item) => this.resolveItem(item, items, outcomeCategories)));

        return {
            date: rawData.date,
            amount: rawData.amount,
            contractorId,
            contractorName,
            isNewContractor,
            description: rawData.description,
            items: normalizedItems,
            rawExtracted: rawData,
        };
    }

    // ─── Contractor resolution ────────────────────────────────────────────────

    private async resolveContractor(
        extractedName: string | null,
        contractors: Contractor[],
    ): Promise<[contractorId: number | null, contractorName: string | null, isNew: boolean]> {
        if (!extractedName) return [null, null, false];

        const contractorPool = contractors.map((c) => ({ id: c.id, name: c.name }));
        const extendedCandidates = this.topFuzzyCandidates(extractedName, contractorPool, RETRY_PASS_CANDIDATES);
        const firstPassCandidates = extendedCandidates.slice(0, FIRST_PASS_CANDIDATES);

        if (extendedCandidates.length === 0) {
            this.logger.log(`Contractor "${extractedName}" has no fuzzy candidates — will be created`);
            return [null, extractedName, true];
        }

        if (firstPassCandidates[0].score >= AUTO_MATCH_THRESHOLD) {
            this.logger.debug(`Contractor "${extractedName}" auto-matched to "${firstPassCandidates[0].name}" (${firstPassCandidates[0].score.toFixed(2)})`);
            return [firstPassCandidates[0].id, firstPassCandidates[0].name, false];
        }

        const match = await this.resolveWithAI(extractedName, firstPassCandidates, extendedCandidates);
        if (match) return [match.id, match.name, false];

        this.logger.log(`Contractor "${extractedName}" unresolved — will be created`);
        return [null, extractedName, true];
    }

    // ─── Item resolution ──────────────────────────────────────────────────────

    private async resolveItem(
        extracted: { name: string; price: number; quantity?: number },
        allItems: Item[],
        categories: Category[],
    ): Promise<NormalizedItem> {
        const base: Omit<NormalizedItem, 'suggestedContainer' | 'historicalContainers' | 'containerConfidence' | 'needsContainerConfirmation'> = {
            itemId: null,
            isNew: true,
            name: extracted.name,
            brand: null,
            categoryId: null,
            price: extracted.price,
            quantity: extracted.quantity ?? 1,
        };

        // Resolve item identity
        const itemPool = allItems.map((i) => ({ id: i.id, name: this.formatItemLabel(i) }));
        const extendedCandidates = this.topFuzzyCandidates(extracted.name, itemPool, RETRY_PASS_CANDIDATES);
        const firstPassCandidates = extendedCandidates.slice(0, FIRST_PASS_CANDIDATES);

        let resolvedItem: Item | null = null;

        if (extendedCandidates.length > 0) {
            if (firstPassCandidates[0].score >= AUTO_MATCH_THRESHOLD) {
                this.logger.debug(`Item "${extracted.name}" auto-matched to "${firstPassCandidates[0].name}" (${firstPassCandidates[0].score.toFixed(2)})`);
                resolvedItem = allItems.find((i) => i.id === firstPassCandidates[0].id) ?? null;
            } else {
                const match = await this.resolveWithAI(extracted.name, firstPassCandidates, extendedCandidates, categories);
                if (match) {
                    resolvedItem = allItems.find((i) => i.id === match.id) ?? null;
                }
            }
        }

        if (!resolvedItem) {
            this.logger.debug(`Item "${extracted.name}" unresolved — will be created`);
        }

        const itemFields = resolvedItem
            ? { itemId: resolvedItem.id, isNew: false, name: resolvedItem.name, brand: resolvedItem.brand ?? null, categoryId: resolvedItem.categoryId ?? null }
            : {};

        // Resolve container against the matched item (or from OCR name for new items)
        const containerResult = await this.resolveContainer(extracted.name, extracted.price, resolvedItem);

        return {
            ...base,
            ...itemFields,
            ...containerResult,
        };
    }

    // ─── Container resolution ─────────────────────────────────────────────────

    private async resolveContainer(
        extractedName: string,
        extractedPrice: number,
        resolvedItem: Item | null,
    ): Promise<Pick<NormalizedItem, 'suggestedContainer' | 'historicalContainers' | 'containerConfidence' | 'needsContainerConfirmation'>> {
        if (resolvedItem !== null) {
            // Known item — look up historically used containers
            const historicalPairs = await this.itemsWithContainersDao.getContainersUsedWithItem(resolvedItem.id);

            if (historicalPairs.length === 0) {
                // No container history — fall through to name-based extraction below
                return this.resolveContainerFromName(extractedName);
            }

            if (historicalPairs.length === 1) {
                // Exactly one container ever used → accept automatically
                const suggested = this.pairToSuggested(historicalPairs[0], null);
                this.logger.debug(`Item "${resolvedItem.name}" has single historical container "${suggested.name}" — auto-accepted`);
                return {
                    suggestedContainer: suggested,
                    historicalContainers: [suggested],
                    containerConfidence: 'auto-single',
                    needsContainerConfirmation: false,
                };
            }

            // Multiple containers — try to narrow down
            const historical = await this.enrichWithLastPrices(resolvedItem.id, historicalPairs);

            // 1. Try price proximity
            const priceMatch = this.findByPriceProximity(extractedPrice, historical);
            if (priceMatch) {
                this.logger.debug(
                    `Item "${resolvedItem.name}" container resolved by price proximity → "${priceMatch.suggested.name}" (lastPrice=${priceMatch.suggested.lastUnitPrice})`,
                );
                return {
                    suggestedContainer: priceMatch.suggested,
                    historicalContainers: historical.map((h) => h.suggested),
                    containerConfidence: 'price-match',
                    needsContainerConfirmation: true, // still show picker — price match is a guess
                };
            }

            // 2. Try dimension extraction from OCR name
            const parsed = parseContainerDimensions(extractedName);
            if (parsed) {
                const dimensionMatch = historical.find((h) => matchesDimensions(h.suggested, parsed));
                if (dimensionMatch) {
                    this.logger.debug(`Item "${resolvedItem.name}" container resolved by dimensions from name → "${dimensionMatch.suggested.name}"`);
                    return {
                        suggestedContainer: dimensionMatch.suggested,
                        historicalContainers: historical.map((h) => h.suggested),
                        containerConfidence: 'dimension-match',
                        needsContainerConfirmation: true,
                    };
                }
            }

            // Could not narrow down — return all options for user
            this.logger.debug(`Item "${resolvedItem.name}" has ${historicalPairs.length} containers, could not narrow down — user must confirm`);
            return {
                suggestedContainer: null,
                historicalContainers: historical.map((h) => h.suggested),
                containerConfidence: 'none',
                needsContainerConfirmation: true,
            };
        }

        // New item — try to infer container from the OCR name
        return this.resolveContainerFromName(extractedName);
    }

    /**
     * For new items: parse volume/weight from the OCR name and look for a matching
     * existing container in the DB.  Returns no confirmation required if nothing found
     * (no point showing an empty picker for a brand-new item).
     */
    private async resolveContainerFromName(
        extractedName: string,
    ): Promise<Pick<NormalizedItem, 'suggestedContainer' | 'historicalContainers' | 'containerConfidence' | 'needsContainerConfirmation'>> {
        const parsed = parseContainerDimensions(extractedName);
        if (!parsed) {
            return { suggestedContainer: null, historicalContainers: [], containerConfidence: 'none', needsContainerConfirmation: false };
        }

        // Look for an existing container with matching dimensions
        const allContainers: Container[] = await this.dataSource.getRepository(Container).find();
        const match = allContainers.find((c) => matchesDimensions(c, parsed));

        if (match) {
            const suggested: SuggestedContainer = {
                id: match.id,
                name: match.name,
                volume: match.volume,
                volumeUnit: match.volumeUnit,
                weight: match.weight,
                weightUnit: match.weightUnit,
                itemCount: match.itemCount,
                lastUnitPrice: null,
            };
            this.logger.debug(`New item: container "${match.name}" inferred from OCR name "${extractedName}" by dimensions`);
            return {
                suggestedContainer: suggested,
                historicalContainers: [],
                containerConfidence: 'dimension-match',
                needsContainerConfirmation: true,
            };
        }

        return { suggestedContainer: null, historicalContainers: [], containerConfidence: 'none', needsContainerConfirmation: false };
    }

    // ─── Price enrichment ─────────────────────────────────────────────────────

    /**
     * Fetch the most recent unit price for each container+item pair from transfer_item.
     * The ItemsWithContainers view groups by item+container but strips pricing data,
     * so we need a targeted raw query here.
     */
    private async enrichWithLastPrices(
        itemId: number,
        pairs: ItemsWithContainers[],
    ): Promise<Array<{ suggested: SuggestedContainer; lastUnitPrice: number | null }>> {
        const priceRows: ContainerWithPrice[] = await this.dataSource.query(
            `SELECT ti.container_id AS containerId, ti.unit_price AS lastUnitPrice
             FROM transfer_item ti
             JOIN transfer t ON t.id = ti.transfer_id
             WHERE ti.item_id = ? AND ti.container_id IS NOT NULL
             ORDER BY t.date DESC`,
            [itemId],
        );

        // Keep only the first (most recent) row per container
        const latestPriceByContainer = new Map<number, number>();
        for (const row of priceRows) {
            if (!latestPriceByContainer.has(row.containerId)) {
                latestPriceByContainer.set(row.containerId, row.lastUnitPrice);
            }
        }

        return pairs.map((pair) => ({
            suggested: this.pairToSuggested(pair, latestPriceByContainer.get(pair.containerId) ?? null),
            lastUnitPrice: latestPriceByContainer.get(pair.containerId) ?? null,
        }));
    }

    private findByPriceProximity(
        receiptPrice: number,
        enriched: Array<{ suggested: SuggestedContainer; lastUnitPrice: number | null }>,
    ): { suggested: SuggestedContainer } | null {
        if (receiptPrice <= 0) return null;

        const withPrice = enriched.filter(
            (e): e is { suggested: SuggestedContainer; lastUnitPrice: number } => e.lastUnitPrice !== null && e.lastUnitPrice > 0,
        );
        if (withPrice.length === 0) return null;

        const closest = withPrice.reduce((best, current) => {
            const currentDiff = Math.abs((current.lastUnitPrice - receiptPrice) / receiptPrice);
            const bestDiff = Math.abs((best.lastUnitPrice - receiptPrice) / receiptPrice);
            return currentDiff < bestDiff ? current : best;
        });

        const relativeDiff = Math.abs((closest.lastUnitPrice - receiptPrice) / receiptPrice);
        if (relativeDiff <= PRICE_MATCH_TOLERANCE) {
            return { suggested: closest.suggested };
        }

        return null;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private pairToSuggested(pair: ItemsWithContainers, lastUnitPrice: number | null): SuggestedContainer {
        return {
            id: pair.containerId,
            name: pair.containerName,
            volume: pair.containerVolume,
            volumeUnit: pair.containerVolumeUnit,
            weight: pair.containerWeight,
            weightUnit: pair.containerWeightUnit,
            itemCount: pair.containerItemCount,
            lastUnitPrice,
        };
    }

    private formatItemLabel(item: Item): string {
        const parts = [item.brand, item.name, item.containerSize ? `${item.containerSize}${item.containerSizeUnit ?? ''}` : null];
        return parts.filter((p): p is string => p !== null && p !== undefined && p !== '').join(' ');
    }

    // ─── AI resolution with retry ─────────────────────────────────────────────

    private async resolveWithAI(
        query: string,
        candidates: FuzzyCandidate[],
        extendedCandidates?: FuzzyCandidate[],
        categories?: Category[],
    ): Promise<FuzzyCandidate | null> {
        for (let attempt = 0; attempt < 2; attempt++) {
            const pool = attempt === 0 ? candidates : (extendedCandidates ?? candidates);
            const result = await this.ollamaService.resolveEntityMatch(query, pool, categories);

            if (result !== null && result.confidence >= AI_CONFIDENCE_THRESHOLD && result.matchedId !== null) {
                const matched = pool.find((c) => c.id === result.matchedId);
                if (matched) {
                    this.logger.debug(`AI resolved "${query}" → "${matched.name}" (confidence=${result.confidence.toFixed(2)}, attempt=${attempt + 1})`);
                    return matched;
                }
            }

            if (attempt === 0) {
                this.logger.debug(
                    `AI pass 1 for "${query}" unconfident (confidence=${result?.confidence ?? 0}, matchedId=${result?.matchedId ?? null}) — retrying with ${(extendedCandidates ?? candidates).length} candidates`,
                );
            }
        }

        return null;
    }

    // ─── Fuzzy matching ───────────────────────────────────────────────────────

    private topFuzzyCandidates(query: string, candidates: Array<{ id: number; name: string }>, topN: number): FuzzyCandidate[] {
        return candidates
            .map((c) => ({ ...c, score: jaroWinklerNormalized(query, c.name) }))
            .filter((c) => c.score >= MINIMUM_FUZZY_SCORE)
            .sort((a, b) => b.score - a.score)
            .slice(0, topN);
    }
}

// ─── Container dimension parsing ──────────────────────────────────────────────

/**
 * Extract volume, weight, or item count from a product name string.
 * Exported for unit testing.
 * Handles common Polish/European receipt formats.
 * Examples: "Mleko UHT 1L", "Ser żółty 250g", "Piwo 6x330ml", "Sok 0,5l"
 */
export function parseContainerDimensions(name: string): ParsedDimensions | null {
    const n = name.toLowerCase();
    const result: ParsedDimensions = {};
    let found = false;

    // Volume: "1L", "500ml", "0,5l", "1.5l", "33cl"
    const volumeMatch = n.match(/(\d+(?:[.,]\d+)?)\s*(ml|cl|dl|l)\b/);
    if (volumeMatch) {
        result.volume = parseFloat(volumeMatch[1].replace(',', '.'));
        result.volumeUnit = volumeMatch[2] === 'l' ? 'L' : volumeMatch[2].toUpperCase();
        found = true;
    }

    // Weight: "250g", "1kg", "500 g"
    const weightMatch = n.match(/(\d+(?:[.,]\d+)?)\s*(mg|g|kg)\b/);
    if (weightMatch) {
        result.weight = parseFloat(weightMatch[1].replace(',', '.'));
        result.weightUnit = weightMatch[2];
        found = true;
    }

    // Item count in a pack: "6x330ml", "6 szt", "4-pack", "12pak"
    const countMatch = n.match(/(\d+)\s*(?:x|×|szt\.?|pak(?:iet)?|pack)\b/);
    if (countMatch) {
        result.itemCount = parseInt(countMatch[1]);
        found = true;
    }

    return found ? result : null;
}

/**
 * Check whether a container's physical dimensions match parsed receipt dimensions.
 * Matches on volume OR weight. Exported for unit testing.
 */
export function matchesDimensions(
    container: { volume?: number | null; volumeUnit?: string | null; weight?: number | null; weightUnit?: string | null; itemCount?: number | null },
    parsed: ParsedDimensions,
): boolean {
    const volumeMatch =
        parsed.volume !== undefined &&
        container.volume !== null &&
        container.volume !== undefined &&
        Math.abs(container.volume - parsed.volume) < 0.01 &&
        (!parsed.volumeUnit || container.volumeUnit?.toLowerCase() === parsed.volumeUnit.toLowerCase());

    const weightMatch =
        parsed.weight !== undefined &&
        container.weight !== null &&
        container.weight !== undefined &&
        Math.abs(container.weight - parsed.weight) < 0.01 &&
        (!parsed.weightUnit || container.weightUnit?.toLowerCase() === parsed.weightUnit.toLowerCase());

    return volumeMatch || weightMatch;
}

// ─── Jaro-Winkler similarity ──────────────────────────────────────────────────

function jaroSimilarity(s1: string, s2: string): number {
    if (s1 === s2) return 1;
    const len1 = s1.length;
    const len2 = s2.length;
    const matchDist = Math.max(Math.floor(Math.max(len1, len2) / 2) - 1, 0);
    const s1Matches = new Array<boolean>(len1).fill(false);
    const s2Matches = new Array<boolean>(len2).fill(false);
    let matches = 0;
    let transpositions = 0;

    for (let i = 0; i < len1; i++) {
        const start = Math.max(0, i - matchDist);
        const end = Math.min(i + matchDist + 1, len2);
        for (let j = start; j < end; j++) {
            if (s2Matches[j] || s1[i] !== s2[j]) continue;
            s1Matches[i] = true;
            s2Matches[j] = true;
            matches++;
            break;
        }
    }
    if (matches === 0) return 0;

    let k = 0;
    for (let i = 0; i < len1; i++) {
        if (!s1Matches[i]) continue;
        while (!s2Matches[k]) k++;
        if (s1[i] !== s2[k]) transpositions++;
        k++;
    }

    return (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
}

function jaroWinklerNormalized(a: string, b: string): number {
    const norm = (s: string) =>
        s
            .toLowerCase()
            .trim()
            .replace(/[.,;:!?]/g, '')
            .replace(/\s+/g, ' ');
    const s1 = norm(a);
    const s2 = norm(b);
    const jaro = jaroSimilarity(s1, s2);
    let prefix = 0;
    for (let i = 0; i < Math.min(4, s1.length, s2.length); i++) {
        if (s1[i] === s2[i]) prefix++;
        else break;
    }
    return jaro + prefix * 0.1 * (1 - jaro);
}
