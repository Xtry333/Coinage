import { NullTransformPipe } from './null-transform.pipe';

describe('NullTransformPipe', () => {
    it('does nothing if value is defined', () => {
        const pipe = new NullTransformPipe();
        const value = 'Text';
        expect(pipe.transform(value)).toEqual(value);
    });

    it('changes value into default if undefined', () => {
        const pipe = new NullTransformPipe();
        const value: string | undefined = undefined;
        expect(pipe.transform(value)).toEqual(value);
    });

    it('changes value into passed if undefined', () => {
        const pipe = new NullTransformPipe();
        const value: string | undefined = undefined;
        const passed = '!!!';
        expect(pipe.transform(value, passed)).toEqual(passed);
    });
});
