import { Currency } from 'src/app/entities/Currency.entity';

export function createMockCurrency(symbol: string): Currency {
    const currency = new Currency();
    currency.symbol = symbol;
    currency.name = `Currency ${symbol}`;
    currency.shorthand = `% ${symbol.toLowerCase()}`;
    return currency;
}
