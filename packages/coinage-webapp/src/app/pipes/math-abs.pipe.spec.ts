import { MathAbsPipe } from './math-abs.pipe';

describe('MathAbsPipe', () => {
    let pipe: MathAbsPipe;

    beforeEach(() => {
        pipe = new MathAbsPipe();
    });

    it('create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    it('Performs abs operation', () => {
        expect(pipe.transform(25)).toEqual(25);
        expect(pipe.transform(-50)).toEqual(50);
    });

    it('returns 0 for zero input', () => {
        expect(pipe.transform(0)).toEqual(0);
    });

    it('handles floating point values', () => {
        expect(pipe.transform(-3.14)).toBeCloseTo(3.14);
        expect(pipe.transform(2.718)).toBeCloseTo(2.718);
    });

    it('handles large negative numbers', () => {
        expect(pipe.transform(-1000000)).toEqual(1000000);
    });
});
