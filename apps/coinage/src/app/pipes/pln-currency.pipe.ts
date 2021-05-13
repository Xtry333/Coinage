import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'plnCurrency',
})
export class PlnCurrencyPipe implements PipeTransform {
    public readonly CURRENCY = 'zł';
    transform(value: number): unknown {
        return value.toFixed(2).replace('.', ',') + ' ' + this.CURRENCY;
    }
}
