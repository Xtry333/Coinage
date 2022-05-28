import { PagedRequest } from '../partial/Paged.request';
import { Range } from './interfaces';
import { TransferTypeEnum } from '../model/TransferDetails.dto.response';

export class GetFilteredTransfersRequest extends PagedRequest {
    public transferIds?: number[];
    public description?: string;
    public amount?: Range<number>;
    public contractorIds?: number[];
    public categoryIds?: number[];
    public accountIds?: number[];
    public userId?: number;
    public type?: TransferTypeEnum;
    public date?: Range<Date>;
    public showPlanned?: boolean;
}
