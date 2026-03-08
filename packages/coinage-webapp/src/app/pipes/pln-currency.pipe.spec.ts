import { PlnCurrencyPipe } from './pln-currency.pipe';

describe('PlnCurrencyPipe', () => {
    let pipe: PlnCurrencyPipe;

    beforeEach(() => {
        pipe = new PlnCurrencyPipe();
    });

    it('transforms number into currency', () => {
        expect(pipe.transform(100.0)).toEqual('100,00 ' + pipe.CURRENCY_SYMBOL);
        expect(pipe.transform(0)).toEqual('0,00 ' + pipe.CURRENCY_SYMBOL);
    });

    it('formats negative values with a minus sign', () => {
        expect(pipe.transform(-100.5)).toEqual('-100,50 ' + pipe.CURRENCY_SYMBOL);
    });

    it('formats decimal values correctly with comma separator', () => {
        expect(pipe.transform(1234.56)).toEqual('1234,56 ' + pipe.CURRENCY_SYMBOL);
    });

    it('returns fallback string when value is null', () => {
        expect(pipe.transform(null)).toEqual('- ' + pipe.CURRENCY_SYMBOL);
    });

    it('returns fallback string when value is undefined', () => {
        expect(pipe.transform(undefined)).toEqual('- ' + pipe.CURRENCY_SYMBOL);
    });

    it('coerces string numbers to numeric values', () => {
        expect(pipe.transform('123.45' as any)).toEqual('123,45 ' + pipe.CURRENCY_SYMBOL);
    });

    it('formats zero correctly', () => {
        expect(pipe.transform(0)).toEqual('0,00 ' + pipe.CURRENCY_SYMBOL);
    });
});
