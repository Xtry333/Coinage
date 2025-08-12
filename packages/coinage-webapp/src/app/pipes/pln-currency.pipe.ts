import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'plnCurrency',
    standalone: false,
})
export class PlnCurrencyPipe implements PipeTransform {
    public readonly CURRENCY_SYMBOL = 'zł';

    public transform(value: number | null | undefined): string {
        if (value === null || value === undefined) {
            return '- ' + this.CURRENCY_SYMBOL;
        }
        if (typeof value === 'string') {
            value = Number(value);
        }
        return value.toFixed(2).replace('.', ',') + ' ' + this.CURRENCY_SYMBOL;
    }
}
