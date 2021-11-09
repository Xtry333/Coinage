import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'nullTransform',
})
export class NullTransformPipe implements PipeTransform {
    transform(value?: unknown, valueIfNull: string = '-'): unknown {
        return value ? value : valueIfNull;
    }
}
