import { BadRequestException } from '@nestjs/common';

import { roundMoney } from '@app/interfaces';

import { Transfer, TransferTypeEnum } from '../../entities/Transfer.entity';

export function assertNonnegativeTransferAmount(amount: number): void {
    if (!Number.isFinite(amount)) throw new BadRequestException('Transfer amount must be finite.');
    if (amount < 0) throw new BadRequestException('Transfer amount must not be negative. Use an explicit refund for returns.');
}

/** Validate money movements without changing their explicitly selected accounts. */
export function prepareTransferForSave<T extends Partial<Transfer>>(transfer: T): T {
    if (transfer.amount === undefined) return transfer;
    assertNonnegativeTransferAmount(transfer.amount);
    transfer.amount = roundMoney(transfer.amount);
    if (transfer.ownerUserId != null) {
        const originOwned = transfer.originAccount?.userId === transfer.ownerUserId;
        const targetOwned = transfer.targetAccount?.userId === transfer.ownerUserId;
        if (originOwned !== targetOwned) transfer.type = originOwned ? TransferTypeEnum.OUTCOME : TransferTypeEnum.INCOME;
    }
    // INTERNAL is derived from ownership; the persisted type column accepts cash-flow types only.
    if (transfer.type === TransferTypeEnum.INTERNAL) transfer.type = TransferTypeEnum.OUTCOME;
    return transfer;
}

/** Signed expense relative to the owner, including reversals and full refunds. */
export function transferExpenseAmount(transfer: Transfer, userId: number | null = transfer.ownerUserId): number {
    if (userId == null) return 0;
    const originOwned = transfer.originAccount?.userId === userId;
    const targetOwned = transfer.targetAccount?.userId === userId;
    return transfer.amount * (Number(originOwned) - Number(targetOwned));
}
