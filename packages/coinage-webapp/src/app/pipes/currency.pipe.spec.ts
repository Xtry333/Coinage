import { CurrencyPipe } from './currency.pipe';

describe(CurrencyPipe.name, () => {
    let pipe: CurrencyPipe;

    beforeEach(() => {
        pipe = new CurrencyPipe();
    });

    it('transforms number into PLN currency', () => {
        expect(pipe.transform(100.0, 'PLN')).toEqual('100,00 zł');
        expect(pipe.transform(0, 'PLN')).toEqual('0,00 zł');
    });

    it('transforms number into EUR currency', () => {
        expect(pipe.transform(100.0, 'EUR')).toEqual('€100,00');
        expect(pipe.transform(0, 'EUR')).toEqual('€0,00');
    });

    it('transforms negative PLN values correctly', () => {
        expect(pipe.transform(-100.5, 'PLN')).toEqual('-100,50 zł');
        expect(pipe.transform(-0.01, 'PLN')).toEqual('-0,01 zł');
    });

    it('transforms negative EUR values correctly', () => {
        expect(pipe.transform(-100.5, 'EUR')).toEqual('€-100,50');
    });

    it('returns placeholder with symbol when value is null', () => {
        const result = pipe.transform(null, 'PLN');
        expect(result).toContain('zł');
    });

    it('returns placeholder with symbol when value is undefined', () => {
        const result = pipe.transform(undefined, 'EUR');
        expect(result).toContain('€');
    });

    it('transforms unknown currency using code as suffix', () => {
        expect(pipe.transform(50.0, 'USD')).toEqual('50,00 USD');
        expect(pipe.transform(0, 'GBP')).toEqual('0,00 GBP');
    });

    it('handles string number input by coercing to number', () => {
        expect(pipe.transform('123.45' as any, 'PLN')).toEqual('123,45 zł');
    });

    it('handles large numbers correctly', () => {
        expect(pipe.transform(1000000.99, 'PLN')).toEqual('1000000,99 zł');
    });
});
