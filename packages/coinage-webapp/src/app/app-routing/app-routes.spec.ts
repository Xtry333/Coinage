import { CoinageRoutes } from './app-routes';

describe('item edit routing', () => {
    it('registers a guarded item edit page', () => {
        const route = CoinageRoutes.EditItemPage.getRoute();
        expect(route.path).toBe('item/edit/:id');
        expect(route.component?.name).toBe('EditItemComponent');
        expect(route.canActivate).toEqual(CoinageRoutes.TransferItemDetailsPage.getRoute().canActivate);
        expect(CoinageRoutes.EditItemPage.getUrl({ id: 12 })).toBe('/item/edit/12');
    });
});
