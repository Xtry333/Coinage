import { makeCategory, makeContainer, makeContractor, makeItem, makeItemContainerPair } from '@coinage-app/test/mock-generators/receipt-normalization.mock';
import { createSpyFromClass, Spy } from 'jest-auto-spies';
import { DataSource } from 'typeorm';

import { CategoryDao } from '../../daos/category.dao';
import { ContractorDao } from '../../daos/contractor.dao';
import { ItemDao } from '../../daos/item.dao';
import { ItemsWithContainersDao } from '../../daos/itemsWithContainers.dao';
import { TransferTypeEnum } from '../../entities/Category.entity';
import { OllamaService } from './ollama.service';
import { matchesDimensions, parseContainerDimensions, ReceiptNormalizationService } from './receipt-normalization.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDataSource(priceRows: Array<{ containerId: number; lastUnitPrice: number }> = [], containers = []): Partial<DataSource> {
    return {
        query: jest.fn().mockResolvedValue(priceRows),
        getRepository: jest.fn().mockReturnValue({ find: jest.fn().mockResolvedValue(containers) }),
    };
}

// ─── parseContainerDimensions ─────────────────────────────────────────────────

describe('parseContainerDimensions', () => {
    describe('volume extraction', () => {
        it.each([
            ['Mleko UHT 1L', { volume: 1, volumeUnit: 'L' }],
            ['Woda mineralna 500ml', { volume: 500, volumeUnit: 'ML' }],
            ['Sok jabłkowy 0,5l', { volume: 0.5, volumeUnit: 'L' }],
            ['Piwo jasne 330ml', { volume: 330, volumeUnit: 'ML' }],
            ['Napój 1.5l', { volume: 1.5, volumeUnit: 'L' }],
            ['Syrop 250cl', { volume: 250, volumeUnit: 'CL' }],
        ])('"%s" → volume %o', (input, expected) => {
            expect(parseContainerDimensions(input)).toMatchObject(expected);
        });
    });

    describe('weight extraction', () => {
        it.each([
            ['Ser żółty 250g', { weight: 250, weightUnit: 'g' }],
            ['Masło 500 g', { weight: 500, weightUnit: 'g' }],
            ['Mąka 1kg', { weight: 1, weightUnit: 'kg' }],
            ['Sól 1,5kg', { weight: 1.5, weightUnit: 'kg' }],
        ])('"%s" → weight %o', (input, expected) => {
            expect(parseContainerDimensions(input)).toMatchObject(expected);
        });
    });

    describe('item count extraction', () => {
        it.each([
            ['Jajka 10 szt', { itemCount: 10 }],
            ['Piwo 6x330ml', { itemCount: 6 }],
            ['Tabletki 20pak', { itemCount: 20 }],
        ])('"%s" → itemCount %o', (input, expected) => {
            expect(parseContainerDimensions(input)).toMatchObject(expected);
        });
    });

    describe('combined', () => {
        it('extracts both volume and item count from "6x330ml"', () => {
            const result = parseContainerDimensions('Piwo 6x330ml');
            expect(result).toMatchObject({ volume: 330, volumeUnit: 'ML', itemCount: 6 });
        });
    });

    describe('returns null when no dimensions present', () => {
        it.each(['Chleb razowy', 'Ketchup Heinz', 'Zapałki', 'Szynka wieprzowa'])('"%s" → null', (input) => {
            expect(parseContainerDimensions(input)).toBeNull();
        });
    });
});

// ─── matchesDimensions ────────────────────────────────────────────────────────

describe('matchesDimensions', () => {
    it('matches by volume', () => {
        const c = { volume: 1, volumeUnit: 'L', weight: null, weightUnit: null, itemCount: null };
        expect(matchesDimensions(c, { volume: 1, volumeUnit: 'L' })).toBe(true);
    });

    it('matches by volume case-insensitively', () => {
        const c = { volume: 500, volumeUnit: 'ml', weight: null, weightUnit: null, itemCount: null };
        expect(matchesDimensions(c, { volume: 500, volumeUnit: 'ML' })).toBe(true);
    });

    it('matches by weight', () => {
        const c = { volume: null, volumeUnit: null, weight: 250, weightUnit: 'g', itemCount: null };
        expect(matchesDimensions(c, { weight: 250, weightUnit: 'g' })).toBe(true);
    });

    it('does not match when volume value differs', () => {
        const c = { volume: 2, volumeUnit: 'L', weight: null, weightUnit: null, itemCount: null };
        expect(matchesDimensions(c, { volume: 1, volumeUnit: 'L' })).toBe(false);
    });

    it('does not match when unit differs', () => {
        const c = { volume: 500, volumeUnit: 'L', weight: null, weightUnit: null, itemCount: null };
        expect(matchesDimensions(c, { volume: 500, volumeUnit: 'ML' })).toBe(false);
    });

    it('does not match when container has no dimensions', () => {
        const c = { volume: null, volumeUnit: null, weight: null, weightUnit: null, itemCount: null };
        expect(matchesDimensions(c, { volume: 1, volumeUnit: 'L' })).toBe(false);
    });
});

// ─── ReceiptNormalizationService ──────────────────────────────────────────────

describe('ReceiptNormalizationService', () => {
    let service: ReceiptNormalizationService;
    let categoryDao: Spy<CategoryDao>;
    let contractorDao: Spy<ContractorDao>;
    let itemDao: Spy<ItemDao>;
    let itemsWithContainersDao: Spy<ItemsWithContainersDao>;
    let ollamaService: Spy<OllamaService>;
    let dataSource: ReturnType<typeof makeDataSource>;

    const groceries = makeCategory(1, 'Groceries', TransferTypeEnum.OUTCOME);
    const salary = makeCategory(2, 'Salary', TransferTypeEnum.INCOME);

    beforeEach(() => {
        categoryDao = createSpyFromClass(CategoryDao);
        contractorDao = createSpyFromClass(ContractorDao);
        itemDao = createSpyFromClass(ItemDao);
        itemsWithContainersDao = createSpyFromClass(ItemsWithContainersDao);
        ollamaService = createSpyFromClass(OllamaService);
        dataSource = makeDataSource();

        // Default: empty DB, AI returns no match
        categoryDao.getAll.mockResolvedValue([groceries, salary]);
        contractorDao.getActive.mockResolvedValue([]);
        itemDao.getAll.mockResolvedValue([]);
        itemsWithContainersDao.getContainersUsedWithItem.mockResolvedValue([]);
        ollamaService.resolveEntityMatch.mockResolvedValue(null);

        service = new ReceiptNormalizationService(
            categoryDao,
            contractorDao,
            itemDao,
            itemsWithContainersDao,
            ollamaService,
            dataSource as unknown as DataSource,
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ─── Contractor resolution ────────────────────────────────────────────────

    describe('contractor resolution', () => {
        it('auto-matches an identical contractor name without calling AI', async () => {
            const biedronka = makeContractor(7, 'Biedronka');
            contractorDao.getActive.mockResolvedValue([biedronka]);

            const result = await service.normalize({ contractor: 'Biedronka', items: [] });

            expect(result.contractorId).toBe(7);
            expect(result.contractorName).toBe('Biedronka');
            expect(result.isNewContractor).toBe(false);
            expect(ollamaService.resolveEntityMatch).not.toHaveBeenCalled();
        });

        it('resolves contractor via AI when fuzzy score is not high enough', async () => {
            const biedronka = makeContractor(7, 'Biedronka');
            contractorDao.getActive.mockResolvedValue([biedronka]);
            // OCR produces noisy legal name — fuzzy match gives ~0.75, AI confirms
            ollamaService.resolveEntityMatch.mockResolvedValue({ matchedId: 7, confidence: 0.88 });

            const result = await service.normalize({ contractor: 'BIEDRONKA SP Z OO', items: [] });

            expect(result.contractorId).toBe(7);
            expect(result.isNewContractor).toBe(false);
            expect(ollamaService.resolveEntityMatch).toHaveBeenCalled();
        });

        it('marks contractor as new when AI returns null and no candidates match', async () => {
            contractorDao.getActive.mockResolvedValue([makeContractor(1, 'Lidl')]);

            const result = await service.normalize({ contractor: 'Whole Foods Market', items: [] });

            expect(result.contractorId).toBeNull();
            expect(result.contractorName).toBe('Whole Foods Market');
            expect(result.isNewContractor).toBe(true);
        });

        it('sets contractorId to null and isNewContractor false when no contractor in receipt', async () => {
            const result = await service.normalize({ contractor: null, items: [] });

            expect(result.contractorId).toBeNull();
            expect(result.isNewContractor).toBe(false);
        });
    });

    // ─── Item resolution ──────────────────────────────────────────────────────

    describe('item resolution', () => {
        it('auto-matches an identical item name without calling AI', async () => {
            const milk = makeItem(42, 'Mleko UHT 3,2%');
            itemDao.getAll.mockResolvedValue([milk]);

            const result = await service.normalize({ items: [{ name: 'Mleko UHT 3,2%', price: 2.49 }] });

            expect(result.items[0].itemId).toBe(42);
            expect(result.items[0].isNew).toBe(false);
            expect(result.items[0].name).toBe('Mleko UHT 3,2%');
            expect(ollamaService.resolveEntityMatch).not.toHaveBeenCalled();
        });

        it('resolves item via AI when fuzzy score is not high enough', async () => {
            const milk = makeItem(42, 'Mleko UHT 3,2% 1L');
            itemDao.getAll.mockResolvedValue([milk]);
            ollamaService.resolveEntityMatch.mockResolvedValue({ matchedId: 42, confidence: 0.82 });

            const result = await service.normalize({ items: [{ name: 'mleko uht', price: 2.49 }] });

            expect(result.items[0].itemId).toBe(42);
            expect(result.items[0].isNew).toBe(false);
        });

        it('marks item as new when AI returns null', async () => {
            itemDao.getAll.mockResolvedValue([makeItem(1, 'Chleb razowy')]);

            const result = await service.normalize({ items: [{ name: 'Exotic Mango Juice', price: 5.99 }] });

            expect(result.items[0].itemId).toBeNull();
            expect(result.items[0].isNew).toBe(true);
            expect(result.items[0].name).toBe('Exotic Mango Juice');
        });

        it('preserves brand and categoryId from matched item', async () => {
            const butter = makeItem(10, 'Masło extra', { brand: 'Łaciate', categoryId: 1 });
            itemDao.getAll.mockResolvedValue([butter]);

            const result = await service.normalize({ items: [{ name: 'Masło extra', price: 4.99 }] });

            expect(result.items[0].brand).toBe('Łaciate');
            expect(result.items[0].categoryId).toBe(1);
        });

        it('passes only OUTCOME categories to AI resolution (not income categories)', async () => {
            const item = makeItem(1, 'Test Item');
            itemDao.getAll.mockResolvedValue([item]);
            // trigger AI call with a partial name
            ollamaService.resolveEntityMatch.mockResolvedValue({ matchedId: 1, confidence: 0.9 });

            await service.normalize({ items: [{ name: 'Test Itm', price: 1.0 }] });

            const callArgs = (ollamaService.resolveEntityMatch as jest.Mock).mock.calls[0];
            const categories = callArgs[2] as Array<{ type: string }>;
            expect(categories.every((c) => c.type === TransferTypeEnum.OUTCOME)).toBe(true);
            expect(categories.some((c) => c.type === TransferTypeEnum.INCOME)).toBe(false);
        });

        it('passes price and quantity from receipt to NormalizedItem', async () => {
            const result = await service.normalize({ items: [{ name: 'Brand New Product', price: 9.99, quantity: 3 }] });

            expect(result.items[0].price).toBe(9.99);
            expect(result.items[0].quantity).toBe(3);
        });

        it('defaults quantity to 1 when not provided', async () => {
            const result = await service.normalize({ items: [{ name: 'Something', price: 1.0 }] });

            expect(result.items[0].quantity).toBe(1);
        });

        it('retries AI with fewer candidates when first attempt is unconfident', async () => {
            const items = Array.from({ length: 10 }, (_, i) => makeItem(i + 1, `Item similar ${i}`));
            itemDao.getAll.mockResolvedValue(items);

            ollamaService.resolveEntityMatch
                .mockResolvedValueOnce({ matchedId: null, confidence: 0.4 }) // first pass: unconfident
                .mockResolvedValueOnce({ matchedId: 1, confidence: 0.85 }); // retry: confident

            const result = await service.normalize({ items: [{ name: 'Item similar 0', price: 1.0 }] });

            expect(ollamaService.resolveEntityMatch).toHaveBeenCalledTimes(2);
            expect(result.items[0].itemId).toBe(1);
        });
    });

    // ─── Container resolution ─────────────────────────────────────────────────

    describe('container resolution', () => {
        describe('for a matched item', () => {
            const milkItem = makeItem(42, 'Mleko UHT 3,2%');

            beforeEach(() => {
                itemDao.getAll.mockResolvedValue([milkItem]);
            });

            it('auto-accepts single historical container without asking for confirmation', async () => {
                const pair = makeItemContainerPair(42, 7, '1L karton', { volume: 1, volumeUnit: 'L' });
                itemsWithContainersDao.getContainersUsedWithItem.mockResolvedValue([pair]);

                const result = await service.normalize({ items: [{ name: 'Mleko UHT 3,2%', price: 2.49 }] });
                const item = result.items[0];

                expect(item.suggestedContainer?.id).toBe(7);
                expect(item.containerConfidence).toBe('auto-single');
                expect(item.needsContainerConfirmation).toBe(false);
                expect(item.historicalContainers).toHaveLength(1);
            });

            it('selects container by price proximity when multiple historical containers exist', async () => {
                const pair1L = makeItemContainerPair(42, 7, '1L karton', { volume: 1, volumeUnit: 'L' });
                const pair2L = makeItemContainerPair(42, 8, '2L karton', { volume: 2, volumeUnit: 'L' });
                itemsWithContainersDao.getContainersUsedWithItem.mockResolvedValue([pair1L, pair2L]);

                // Container 7 (1L) last price: 2.39 — close to receipt price 2.49 (~4%)
                // Container 8 (2L) last price: 4.99 — far from receipt price 2.49 (~100%)
                dataSource.query = jest.fn().mockResolvedValue([
                    { containerId: 7, lastUnitPrice: 2.39 },
                    { containerId: 8, lastUnitPrice: 4.99 },
                ]);

                const result = await service.normalize({ items: [{ name: 'Mleko UHT 3,2%', price: 2.49 }] });
                const item = result.items[0];

                expect(item.suggestedContainer?.id).toBe(7);
                expect(item.containerConfidence).toBe('price-match');
                expect(item.needsContainerConfirmation).toBe(true);
                expect(item.historicalContainers).toHaveLength(2);
            });

            it('falls back to dimension matching from OCR name when prices are ambiguous', async () => {
                const pair1L = makeItemContainerPair(42, 7, '1L karton', { volume: 1, volumeUnit: 'L' });
                const pair2L = makeItemContainerPair(42, 8, '2L karton', { volume: 2, volumeUnit: 'L' });
                itemsWithContainersDao.getContainersUsedWithItem.mockResolvedValue([pair1L, pair2L]);
                // Prices are far from receipt price — no price match
                dataSource.query = jest.fn().mockResolvedValue([
                    { containerId: 7, lastUnitPrice: 10.0 },
                    { containerId: 8, lastUnitPrice: 20.0 },
                ]);

                // OCR name contains "1L" → should match the 1L container
                const result = await service.normalize({ items: [{ name: 'Mleko UHT 3,2% 1L', price: 2.49 }] });
                const item = result.items[0];

                expect(item.suggestedContainer?.id).toBe(7);
                expect(item.containerConfidence).toBe('dimension-match');
                expect(item.needsContainerConfirmation).toBe(true);
            });

            it('returns all historical containers with no suggestion when resolution fails', async () => {
                const pair1L = makeItemContainerPair(42, 7, '1L karton', { volume: 1, volumeUnit: 'L' });
                const pair2L = makeItemContainerPair(42, 8, '2L karton', { volume: 2, volumeUnit: 'L' });
                itemsWithContainersDao.getContainersUsedWithItem.mockResolvedValue([pair1L, pair2L]);
                // Prices far off — no price match
                dataSource.query = jest.fn().mockResolvedValue([
                    { containerId: 7, lastUnitPrice: 10.0 },
                    { containerId: 8, lastUnitPrice: 20.0 },
                ]);
                // OCR name has no dimensions — no dimension match either
                const result = await service.normalize({ items: [{ name: 'Mleko UHT', price: 2.49 }] });
                const item = result.items[0];

                expect(item.suggestedContainer).toBeNull();
                expect(item.containerConfidence).toBe('none');
                expect(item.needsContainerConfirmation).toBe(true);
                expect(item.historicalContainers.map((c) => c.id)).toEqual(expect.arrayContaining([7, 8]));
            });

            it('falls through to name-based extraction when item has no container history', async () => {
                itemsWithContainersDao.getContainersUsedWithItem.mockResolvedValue([]);
                const oneL = makeContainer(5, '1L butelka', { volume: 1, volumeUnit: 'L' });
                (dataSource.getRepository as jest.Mock).mockReturnValue({ find: jest.fn().mockResolvedValue([oneL]) });

                const result = await service.normalize({ items: [{ name: 'Mleko UHT 3,2% 1L', price: 2.49 }] });
                const item = result.items[0];

                expect(item.suggestedContainer?.id).toBe(5);
                expect(item.containerConfidence).toBe('dimension-match');
                expect(item.needsContainerConfirmation).toBe(true);
            });
        });

        describe('for a new item', () => {
            it('suggests a container by dimension when OCR name contains volume', async () => {
                itemDao.getAll.mockResolvedValue([]);
                const halfLitre = makeContainer(3, '500ml butelka', { volume: 500, volumeUnit: 'ML' });
                (dataSource.getRepository as jest.Mock).mockReturnValue({ find: jest.fn().mockResolvedValue([halfLitre]) });

                const result = await service.normalize({ items: [{ name: 'Nowy sok 500ml', price: 3.99 }] });
                const item = result.items[0];

                expect(item.isNew).toBe(true);
                expect(item.suggestedContainer?.id).toBe(3);
                expect(item.containerConfidence).toBe('dimension-match');
                expect(item.needsContainerConfirmation).toBe(true);
            });

            it('returns no container suggestion when OCR name has no dimension info', async () => {
                itemDao.getAll.mockResolvedValue([]);

                const result = await service.normalize({ items: [{ name: 'Chleb tostowy', price: 3.5 }] });
                const item = result.items[0];

                expect(item.suggestedContainer).toBeNull();
                expect(item.containerConfidence).toBe('none');
                expect(item.needsContainerConfirmation).toBe(false);
                expect(item.historicalContainers).toHaveLength(0);
            });
        });
    });

    // ─── Top-level normalize() passthrough ───────────────────────────────────

    describe('normalize()', () => {
        it('passes date, amount, and description through unchanged', async () => {
            const result = await service.normalize({ date: '2024-03-01', amount: 45.99, description: 'Weekly shop', items: [] });

            expect(result.date).toBe('2024-03-01');
            expect(result.amount).toBe(45.99);
            expect(result.description).toBe('Weekly shop');
        });

        it('preserves rawExtracted for debugging', async () => {
            const rawData = { contractor: 'Lidl', amount: 12.0, items: [] };
            const result = await service.normalize(rawData);

            expect(result.rawExtracted).toBe(rawData);
        });

        it('handles empty items array', async () => {
            const result = await service.normalize({ items: [] });

            expect(result.items).toHaveLength(0);
        });

        it('processes multiple items independently', async () => {
            itemDao.getAll.mockResolvedValue([makeItem(1, 'Chleb razowy'), makeItem(2, 'Masło')]);

            const result = await service.normalize({
                items: [
                    { name: 'Chleb razowy', price: 3.5 },
                    { name: 'Masło', price: 4.99 },
                    { name: 'Zupełnie nowy produkt XYZ', price: 9.0 },
                ],
            });

            expect(result.items).toHaveLength(3);
            expect(result.items[0].isNew).toBe(false);
            expect(result.items[1].isNew).toBe(false);
            expect(result.items[2].isNew).toBe(true);
        });
    });
});
