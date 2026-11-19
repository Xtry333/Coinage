import { IsArray, IsInt, IsOptional, Min } from 'class-validator';

import { TransferTypeEnum } from '../model/TransferDetails.dto.response';
import { PagedRequest } from '../partial/Paged.request';
import { Range } from './interfaces';

export class GetFilteredTransfersRequest extends PagedRequest {
    public transferIds?: number[];
    public description?: string;
    public amount?: Range<number>;
    public contractorIds?: number[];
    public categoryIds?: number[];
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Min(1, { each: true })
    public tagIds?: number[];
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Min(1, { each: true })
    public excludedTagIds?: number[];
    public accountIds?: number[];
    public userId?: number;
    public type?: TransferTypeEnum;
    public date?: Range<Date>;
    public showPlanned?: boolean;
    public showFlagged?: boolean;
}
