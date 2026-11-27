import { prepareTransferForSave, transferExpenseAmount } from './transfer-amount';
import { Account } from '../../entities/Account.entity';
import { Transfer, TransferTypeEnum } from '../../entities/Transfer.entity';
import { TransferItem } from '../../entities/TransferItem.entity';

describe('nonnegative transfers with signed item prices', () => {
    function transfer(amount: number): Transfer {
        return Object.assign(new Transfer(), {
            amount,
            ownerUserId: 7,
            originAccountId: 1,
            targetAccountId: 17,
            originAccount: Object.assign(new Account(), { id: 1, userId: 7 }),
            targetAccount: Object.assign(new Account(), { id: 17, userId: null }),
            type: TransferTypeEnum.OUTCOME,
            transferItems: [Object.assign(new TransferItem(), { quantity: 6, unitPrice: -0.5, totalSetPrice: -3, totalSetDiscount: 0 })],
        });
    }

    it.each([-3, -0.001])('rejects a negative amount of %s before rounding or changing any fields', (amount) => {
        const value = transfer(amount);
        const before = JSON.stringify(value);
        expect(() => prepareTransferForSave(value)).toThrow('Transfer amount must not be negative');
        expect(JSON.stringify(value)).toBe(before);
    });

    it('preserves accounts, metadata and signed items across both save boundaries', () => {
        const value = transfer(3);
        value.metadata = { note: 'Keep me' };
        const before = JSON.stringify(value);
        prepareTransferForSave(value);
        prepareTransferForSave(value);
        expect(JSON.stringify(value)).toBe(before);
    });

    it('derives income from explicitly selected incoming accounts without changing them', () => {
        const value = transfer(4);
        value.originAccountId = 17;
        value.targetAccountId = 1;
        value.originAccount = Object.assign(new Account(), { id: 17, userId: null });
        value.targetAccount = Object.assign(new Account(), { id: 1, userId: 7 });
        prepareTransferForSave(value);
        expect(value).toMatchObject({ amount: 4, type: TransferTypeEnum.INCOME, originAccountId: 17, targetAccountId: 1 });
        expect(transferExpenseAmount(value)).toBe(-4);
    });

    it.each([0, 3])('does not reverse a nonnegative amount of %s', (amount) => {
        const value = prepareTransferForSave(transfer(amount));
        expect(value).toMatchObject({ amount, originAccountId: 1, targetAccountId: 17 });
    });

    it.each([NaN, Infinity, -Infinity])('rejects a nonfinite amount: %s', (amount) => {
        expect(() => prepareTransferForSave(transfer(amount))).toThrow('finite');
    });

    it('rejects negative amounts even when the target account is absent', () => {
        const value = transfer(-3);
        value.targetAccountId = null;
        expect(() => prepareTransferForSave(value)).toThrow('must not be negative');
    });

    it('rounds valid transfer amounts to cents', () => {
        expect(prepareTransferForSave(transfer(1.005)).amount).toBe(1.01);
    });

    it('does not count an internal transfer as receipt spending', () => {
        const value = transfer(10);
        value.targetAccount = Object.assign(new Account(), { id: 2, userId: 7 });
        expect(transferExpenseAmount(value)).toBe(0);
    });

    it('can reconcile legacy rows without an owner ID from the requesting user perspective', () => {
        const value = transfer(3);
        const legacy: Partial<Transfer> = { ...value };
        delete legacy.ownerUserId;
        expect(transferExpenseAmount(legacy as Transfer, 7)).toBe(3);
    });
});
