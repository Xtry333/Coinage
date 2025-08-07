import { CurrencyPipe } from './currency.pipe';

describe(CurrencyPipe.name, () => {
    it('transforms number into PLN currency', () => {
        const pipe = new CurrencyPipe();
        expect(pipe.transform(100.0, 'PLN')).toEqual('100,00 zł');
        expect(pipe.transform(0, 'PLN')).toEqual('0,00 zł');
    });

    it('transforms number into EUR currency', () => {
        const pipe = new CurrencyPipe();
        expect(pipe.transform(100.0, 'EUR')).toEqual('€100,00');
        expect(pipe.transform(0, 'EUR')).toEqual('€0,00');
    });
});
