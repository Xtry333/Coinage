import { PlnCurrencyPipe } from './pln-currency.pipe';

describe('PlnCurrencyPipe', () => {
    it('create an instance', () => {
        const pipe = new PlnCurrencyPipe();
        expect(pipe.transform('100.00')).toEqual('100,00 ' + pipe.CURRENCY);
    });
});
