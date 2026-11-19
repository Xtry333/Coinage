import { of, throwError } from 'rxjs';

import { CoinageDataService } from '../../services/coinage.data-service';
import { TagSelectorComponent } from './tag-selector.component';

describe('TagSelectorComponent', () => {
    const tag = { id: 1, name: 'Holiday', color: null };
    const data = { getTags: jest.fn(), saveTag: jest.fn() };
    let component: TagSelectorComponent;

    beforeEach(() => {
        jest.resetAllMocks();
        data.getTags.mockReturnValue(of([tag]));
        component = new TagSelectorComponent(data as unknown as CoinageDataService);
    });

    it('loads the shared catalog and emits unique selected IDs', async () => {
        const loaded = jest.spyOn(component.tagsLoaded, 'emit');
        const changed = jest.spyOn(component.tagIdsChange, 'emit');
        await component.ngOnInit();
        component.onChange([1, 1]);
        expect(loaded).toHaveBeenCalledWith([tag]);
        expect(changed).toHaveBeenCalledWith([1]);
        component.onChange(null);
        expect(changed).toHaveBeenLastCalledWith([]);
    });

    it('reuses an existing tag by name rather than creating a duplicate', async () => {
        await component.ngOnInit();
        expect(await component.addTag('  Holiday  ')).toEqual(tag);
        expect(data.saveTag).not.toHaveBeenCalled();
    });

    it('creates a trimmed tag and updates the catalog used for previews', async () => {
        await component.ngOnInit();
        data.saveTag.mockResolvedValue({ insertedId: 2 });
        const loaded = jest.spyOn(component.tagsLoaded, 'emit');
        expect(await component.addTag(' Food ')).toEqual({ id: 2, name: 'Food', color: null });
        expect(data.saveTag).toHaveBeenCalledWith({ name: 'Food' });
        expect(loaded).toHaveBeenCalledWith([{ id: 2, name: 'Food', color: null }, tag]);
    });

    it('reports load failures without allowing an unavailable catalog to be edited', async () => {
        data.getTags.mockReturnValue(throwError(() => new Error('Network')));
        await component.ngOnInit();
        expect(component.loadFailed).toBe(true);
        expect(component.loading).toBe(false);
        expect(component.error).toContain('Could not load');
    });

    it('reports failed creation without adding a phantom tag', async () => {
        await component.ngOnInit();
        data.saveTag.mockRejectedValue(new Error('Duplicate'));
        await expect(component.addTag('Food')).rejects.toThrow('Duplicate');
        expect(component.tags).toEqual([tag]);
        expect(component.error).toContain('Could not create');
    });
});
