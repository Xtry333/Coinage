import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'plnCurrency',
})
export class PlnCurrencyPipe implements PipeTransform {
    public readonly CURRENCY_SYMBOL = 'zł';

    public transform(value: number | null): string {
        if (value === null) {
            return '- ' + this.CURRENCY_SYMBOL;
        }
        return value.toFixed(2).replace('.', ',') + ' ' + this.CURRENCY_SYMBOL;
    }
}
