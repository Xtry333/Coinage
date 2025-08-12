import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'ifNull',
    standalone: false,
})
export class NullTransformPipe implements PipeTransform {
    public static readonly DEFAULT_SYMBOL = '−';

    public transform(value: null | undefined | unknown, valueIfNull: string = NullTransformPipe.DEFAULT_SYMBOL): unknown {
        return value ? value : valueIfNull;
    }
}
