import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'appCurrency',
})
export class CurrencyPipe implements PipeTransform {
    private readonly CURRENCY_SYMBOL: Record<string, string> = { 'EUR': '€', 'PLN': 'zł' };

    public transform(value: number | null | undefined, currency: string): string {
        if (value === null || value === undefined) {
            return '- ' + this.CURRENCY_SYMBOL[currency] || currency;
        }
        if (typeof value === 'string') {
            value = Number(value);
        }
        switch (currency) {
            case 'EUR':
                return this.CURRENCY_SYMBOL[currency] + value.toFixed(2).replace('.', ',');
            case 'PLN':
                return value.toFixed(2).replace('.', ',') + ' ' + this.CURRENCY_SYMBOL[currency];
            default:
                return value.toFixed(2).replace('.', ',') + ' ' + currency;
        }
    }
}
