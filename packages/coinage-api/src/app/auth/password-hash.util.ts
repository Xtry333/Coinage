import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const SCRYPT_PREFIX = 'scrypt';
const SALT_BYTES = 16;
const KEY_BYTES = 32;

export function hashPassword(password: string): string {
    const salt = randomBytes(SALT_BYTES);
    const hash = scryptSync(password, salt, KEY_BYTES);
    return `${SCRYPT_PREFIX}$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function isPasswordHash(value: string): boolean {
    const parts = value.split('$');
    return parts.length === 3 && parts[0] === SCRYPT_PREFIX && /^[a-f\d]{32}$/i.test(parts[1]) && /^[a-f\d]{64}$/i.test(parts[2]);
}

export function verifyPassword(password: string, encodedHash: string): boolean {
    if (!isPasswordHash(encodedHash)) {
        return false;
    }

    const [, saltHex, expectedHashHex] = encodedHash.split('$');
    const expectedHash = Buffer.from(expectedHashHex, 'hex');
    const actualHash = scryptSync(password, Buffer.from(saltHex, 'hex'), KEY_BYTES);
    return timingSafeEqual(actualHash, expectedHash);
}
