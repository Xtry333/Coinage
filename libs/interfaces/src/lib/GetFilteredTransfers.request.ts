import { PagedRequest } from '../partial/Paged.request';
import { TransferTypeEnum } from './interfaces';

export interface GetFilteredTransfersRequest extends PagedRequest {
    transferIds?: number[];
    description?: string;
    amountFrom?: number;
    amountTo?: number;
    contractorIds?: number[];
    categoryIds?: number[];
    accountIds?: number[];
    type?: TransferTypeEnum;
    dateFrom?: string;
    dateTo?: string;
    isPlanned?: boolean;
}
