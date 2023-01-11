import { ReplacePipe } from './replace.pipe';

describe('ReplacePipe', () => {
    it('replaces every occurency of value in string', () => {
        const pipe = new ReplacePipe();
        const value = ' ';
        const replacement = '-';
        const input = 'Jump to ledge.';

        expect(pipe.transform(input, value, replacement)).toEqual('Jump-to-ledge.');
    });

    it('does nothing no occurence of value found', () => {
        const pipe = new ReplacePipe();
        const value = 'space';
        const replacement = 'xxx';
        const input = 'Jump to ledge.';

        expect(pipe.transform(input, value, replacement)).toEqual(input);
    });
});
