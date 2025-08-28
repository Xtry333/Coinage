import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'appCurrency',
    standalone: false,
})
export class CurrencyPipe implements PipeTransform {
    private readonly CURRENCY_SYMBOL: Record<string, string> = { EUR: '€', PLN: 'zł' };

    public transform(value: number | null | undefined, currencyCode: string): string {
        if (value === null || value === undefined) {
            return '- ' + this.CURRENCY_SYMBOL[currencyCode] || currencyCode;
        }
        if (typeof value === 'string') {
            value = Number(value);
        }
        switch (currencyCode) {
            case 'EUR':
                return this.CURRENCY_SYMBOL[currencyCode] + value.toFixed(2).replace('.', ',');
            case 'PLN':
                return value.toFixed(2).replace('.', ',') + ' ' + this.CURRENCY_SYMBOL[currencyCode];
            default:
                return value.toFixed(2).replace('.', ',') + ' ' + currencyCode;
        }
    }
}
