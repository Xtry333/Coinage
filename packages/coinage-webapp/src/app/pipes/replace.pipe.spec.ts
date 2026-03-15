import { ReplacePipe } from './replace.pipe';

describe('ReplacePipe', () => {
    let pipe: ReplacePipe;

    beforeEach(() => {
        pipe = new ReplacePipe();
    });

    it('replaces every occurency of value in string', () => {
        const value = ' ';
        const replacement = '-';
        const input = 'Jump to ledge.';

        expect(pipe.transform(input, value, replacement)).toEqual('Jump-to-ledge.');
    });

    it('does nothing no occurence of value found', () => {
        const value = 'space';
        const replacement = 'xxx';
        const input = 'Jump to ledge.';

        expect(pipe.transform(input, value, replacement)).toEqual(input);
    });

    it('replaces all occurrences not just the first', () => {
        expect(pipe.transform('aaa', 'a', 'b')).toEqual('bbb');
    });

    it('returns empty string when input is empty', () => {
        expect(pipe.transform('', 'a', 'b')).toEqual('');
    });

    it('replaces with empty string effectively removing the pattern', () => {
        expect(pipe.transform('Hello World', ' ', '')).toEqual('HelloWorld');
    });

    it('handles special regex characters in the search value', () => {
        // '.' in a regex matches any character, so it replaces every character
        const result = pipe.transform('a.b.c', '\\.', '-');
        expect(result).toEqual('a-b-c');
    });
});
