import { Injectable, Logger } from '@nestjs/common';

import { CategoryDao } from '../../daos/category.dao';
import { ContractorDao } from '../../daos/contractor.dao';
import { ItemDao } from '../../daos/item.dao';
import { Category, TransferTypeEnum } from '../../entities/Category.entity';
import { Contractor } from '../../entities/Contractor.entity';
import { Item } from '../../entities/Item.entity';
import { OllamaExtractedData, OllamaService } from './ollama.service';

/** Top N fuzzy candidates to send to AI on first attempt. */
const FIRST_PASS_CANDIDATES = 8;
/** Top N fuzzy candidates to send to AI on retry. */
const RETRY_PASS_CANDIDATES = 3;
/** Score threshold above which we skip the AI call and accept the fuzzy match directly. */
const AUTO_MATCH_THRESHOLD = 0.92;
/** Minimum AI confidence to accept a match. */
const AI_CONFIDENCE_THRESHOLD = 0.65;
/** Minimum fuzzy score to consider a candidate at all. */
const MINIMUM_FUZZY_SCORE = 0.5;

export interface NormalizedItem {
    /** null means no existing item matched — a new Item should be created on confirmation. */
    itemId: number | null;
    isNew: boolean;
    name: string;
    brand: string | null;
    categoryId: number | null;
    price: number;
    quantity: number;
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

interface FuzzyCandidate {
    id: number;
    name: string;
    score: number;
}

@Injectable()
export class ReceiptNormalizationService {
    private readonly logger = new Logger(ReceiptNormalizationService.name);

    public constructor(
        private readonly categoryDao: CategoryDao,
        private readonly contractorDao: ContractorDao,
        private readonly itemDao: ItemDao,
        private readonly ollamaService: OllamaService,
    ) {}

    public async normalize(rawData: OllamaExtractedData): Promise<NormalizedReceiptData> {
        const [categories, contractors, items] = await Promise.all([
            this.categoryDao.getAll(),
            this.contractorDao.getActive(),
            this.itemDao.getAll(),
        ]);

        // Only use OUTCOME categories for receipt items (purchases)
        const outcomeCategories = categories.filter((c) => c.type === TransferTypeEnum.OUTCOME);

        const [contractorId, contractorName, isNewContractor] = await this.resolveContractor(rawData.contractor ?? null, contractors);

        const normalizedItems = await Promise.all(
            (rawData.items ?? []).map((item) => this.resolveItem(item, items, outcomeCategories)),
        );

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

        const candidates = this.topFuzzyCandidates(
            extractedName,
            contractors.map((c) => ({ id: c.id, name: c.name })),
            FIRST_PASS_CANDIDATES,
        );

        if (candidates.length === 0) {
            this.logger.log(`Contractor "${extractedName}" has no fuzzy candidates — will be created`);
            return [null, extractedName, true];
        }

        if (candidates[0].score >= AUTO_MATCH_THRESHOLD) {
            this.logger.debug(`Contractor "${extractedName}" auto-matched to "${candidates[0].name}" (${candidates[0].score.toFixed(2)})`);
            return [candidates[0].id, candidates[0].name, false];
        }

        const match = await this.resolveWithAI(extractedName, candidates);
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
        const base: NormalizedItem = {
            itemId: null,
            isNew: true,
            name: extracted.name,
            brand: null,
            categoryId: null,
            price: extracted.price,
            quantity: extracted.quantity ?? 1,
        };

        const candidates = this.topFuzzyCandidates(
            extracted.name,
            allItems.map((i) => ({ id: i.id, name: this.formatItemLabel(i) })),
            FIRST_PASS_CANDIDATES,
        );

        if (candidates.length === 0) {
            this.logger.debug(`Item "${extracted.name}" has no fuzzy candidates — will be created`);
            return base;
        }

        if (candidates[0].score >= AUTO_MATCH_THRESHOLD) {
            this.logger.debug(`Item "${extracted.name}" auto-matched to "${candidates[0].name}" (${candidates[0].score.toFixed(2)})`);
            return this.itemToNormalized(allItems.find((i) => i.id === candidates[0].id)!, base);
        }

        const match = await this.resolveWithAI(extracted.name, candidates, categories);
        if (match) return this.itemToNormalized(allItems.find((i) => i.id === match.id)!, base);

        this.logger.debug(`Item "${extracted.name}" unresolved — will be created`);
        return base;
    }

    private itemToNormalized(item: Item, base: NormalizedItem): NormalizedItem {
        return { ...base, itemId: item.id, isNew: false, name: item.name, brand: item.brand ?? null, categoryId: item.categoryId ?? null };
    }

    private formatItemLabel(item: Item): string {
        const parts = [item.brand, item.name, item.containerSize ? `${item.containerSize}${item.containerSizeUnit ?? ''}` : null];
        return parts.filter(Boolean).join(' ');
    }

    // ─── AI resolution with retry ─────────────────────────────────────────────

    /**
     * Attempt to resolve `query` against `candidates` using the AI.
     * First pass: all candidates. If AI is not confident, retry with top RETRY_PASS_CANDIDATES only.
     * Returns the matched candidate or null if unresolved.
     */
    private async resolveWithAI(
        query: string,
        candidates: FuzzyCandidate[],
        categories?: Category[],
    ): Promise<FuzzyCandidate | null> {
        for (let attempt = 0; attempt < 2; attempt++) {
            const pool = attempt === 0 ? candidates : candidates.slice(0, RETRY_PASS_CANDIDATES);
            const result = await this.ollamaService.resolveEntityMatch(query, pool, categories);

            if (result?.confidence >= AI_CONFIDENCE_THRESHOLD && result.matchedId !== null) {
                const matched = pool.find((c) => c.id === result.matchedId);
                if (matched) {
                    this.logger.debug(`AI resolved "${query}" → "${matched.name}" (confidence=${result.confidence.toFixed(2)}, attempt=${attempt + 1})`);
                    return matched;
                }
            }

            if (attempt === 0) {
                this.logger.debug(
                    `AI pass 1 for "${query}" unconfident (confidence=${result?.confidence ?? 0}, matchedId=${result?.matchedId ?? null}) — retrying with top ${RETRY_PASS_CANDIDATES}`,
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

// ─── Jaro-Winkler similarity ─────────────────────────────────────────────────
// No external dependency — works well for short name strings.

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
