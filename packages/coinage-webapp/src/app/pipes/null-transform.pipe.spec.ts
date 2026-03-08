import { NullTransformPipe } from './null-transform.pipe';

describe('NullTransformPipe', () => {
    let pipe: NullTransformPipe;

    beforeEach(() => {
        pipe = new NullTransformPipe();
    });

    it('does nothing if value is defined', () => {
        const value = 'Text';
        expect(pipe.transform(value)).toEqual(value);
    });

    it('changes value into default if undefined', () => {
        const value: string | undefined = undefined;
        expect(pipe.transform(value)).toEqual(NullTransformPipe.DEFAULT_SYMBOL);
    });

    it('changes value into passed if undefined', () => {
        const passed = '!!!';
        const value: string | undefined = undefined;
        expect(pipe.transform(value, passed)).toEqual(passed);
    });

    it('returns fallback for null value (falsy)', () => {
        expect(pipe.transform(null)).toEqual(NullTransformPipe.DEFAULT_SYMBOL);
    });

    it('returns fallback for 0 (falsy)', () => {
        expect(pipe.transform(0)).toEqual(NullTransformPipe.DEFAULT_SYMBOL);
    });

    it('returns fallback for empty string (falsy)', () => {
        expect(pipe.transform('')).toEqual(NullTransformPipe.DEFAULT_SYMBOL);
    });

    it('passes through truthy non-string values', () => {
        expect(pipe.transform(42)).toEqual(42);
        expect(pipe.transform(true)).toEqual(true);
    });
});
