import { EffectiveTagDTO, effectiveTags, unionEffectiveTags } from '@app/interfaces';

import { Transfer } from '../entities/Transfer.entity';

export function getTransferTags(transfer: Transfer): EffectiveTagDTO[] {
    return effectiveTags(
        transfer.tags,
        (transfer.transferItems ?? []).map((transferItem) => transferItem.item?.tags ?? []),
    );
}

export function getReceiptTags(transfers: Transfer[] = []): EffectiveTagDTO[] {
    return unionEffectiveTags(transfers.map(getTransferTags));
}
