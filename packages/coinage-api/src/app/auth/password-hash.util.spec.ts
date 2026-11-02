import { hashPassword, isPasswordHash, verifyPassword } from './password-hash.util';

describe('password-hash.util', () => {
    it('hashes passwords and verifies the matching password', () => {
        const password = 'test-password';
        const hash = hashPassword(password);

        expect(hash).not.toBe(password);
        expect(isPasswordHash(hash)).toBe(true);
        expect(verifyPassword(password, hash)).toBe(true);
    });

    it('rejects a different password and legacy plain-text values', () => {
        const hash = hashPassword('test-password');

        expect(verifyPassword('wrong-password', hash)).toBe(false);
        expect(isPasswordHash('plain-text-password')).toBe(false);
        expect(verifyPassword('plain-text-password', 'plain-text-password')).toBe(false);
    });
});
