import { MathAbsPipe } from './math-abs.pipe';

describe('MathAbsPipe', () => {
    it('create an instance', () => {
        const pipe = new MathAbsPipe();
        expect(pipe).toBeTruthy();
    });

    it('Performs abs operation', () => {
        const pipe = new MathAbsPipe();
        expect(pipe.transform(25)).toEqual(25);
        expect(pipe.transform(-50)).toEqual(50);
    });
});
