import { PagedRequest } from '../partial/Paged.request';
import { TransferTypeEnum, Range } from './interfaces';

export interface GetFilteredTransfersRequest extends PagedRequest {
    transferIds?: number[];
    description?: string;
    amount?: Range<number>;
    contractorIds?: number[];
    categoryIds?: number[];
    accountIds?: number[];
    type?: TransferTypeEnum;
    date?: Range<string>;
    isPlanned?: boolean;
}
