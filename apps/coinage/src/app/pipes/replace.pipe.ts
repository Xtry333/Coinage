import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'replace',
})
export class ReplacePipe implements PipeTransform {
    public transform(value: string, regexValue: string, replaceValue: string): string {
        return value.replace(new RegExp(regexValue, 'g'), replaceValue);
    }
}
