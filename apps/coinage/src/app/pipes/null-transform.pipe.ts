import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'undefined',
})
export class NullTransformPipe implements PipeTransform {
    public static readonly DEFAULT_SYMBOL = '−';

    public transform(value?: unknown, valueIfNull: string = NullTransformPipe.DEFAULT_SYMBOL): unknown {
        return value ? value : valueIfNull;
    }
}
