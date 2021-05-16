import { PlnCurrencyPipe } from './pln-currency.pipe';

describe('PlnCurrencyPipe', () => {
    it('transforms number into currency', () => {
        const pipe = new PlnCurrencyPipe();
        expect(pipe.transform(100.0)).toEqual('100,00 ' + pipe.CURRENCY);
        expect(pipe.transform(0)).toEqual('0,00 ' + pipe.CURRENCY);
    });
});
