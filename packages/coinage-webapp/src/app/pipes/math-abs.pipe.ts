import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'mathAbs',
})
export class MathAbsPipe implements PipeTransform {
    public transform(value: number): number {
        return Math.abs(value);
    }
}
