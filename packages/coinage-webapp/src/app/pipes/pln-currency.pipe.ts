import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'plnCurrency',
    standalone: false,
})
export class PlnCurrencyPipe implements PipeTransform {
    public readonly CURRENCY_SYMBOL = 'zł';

    public transform(value: number | null | undefined, showCurrencySymbol = true): string {
        const suffix = showCurrencySymbol ? ' ' + this.CURRENCY_SYMBOL : '';
        if (value === null || value === undefined) {
            return '-' + suffix;
        }
        if (typeof value === 'string') {
            value = Number(value);
        }
        return value.toFixed(2).replace('.', ',') + suffix;
    }
}
