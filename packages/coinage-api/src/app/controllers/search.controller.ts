import { GlobalSearchRequest, GlobalSearchResponse } from '@app/interfaces';
import { Controller, Get, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { AuthGuard, RequestingUser } from '../services/auth.guard';
import { SearchService } from '../services/search.service';

class GlobalSearchQueryParams {
    @IsString()
    @IsNotEmpty()
    public query!: string;

    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber()
    @Min(1)
    @Max(50)
    public itemsLimit?: number;

    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber()
    @Min(1)
    @Max(50)
    public transfersLimit?: number;
}

@UseGuards(AuthGuard)
@Controller('search')
export class SearchController {
    public constructor(private readonly searchService: SearchService) {}

    @Get('global')
    public async globalSearch(
        @RequestingUser('id') userId: number,
        @Query(ValidationPipe) queryParams: GlobalSearchQueryParams,
    ): Promise<GlobalSearchResponse> {
        const request = new GlobalSearchRequest(queryParams.query, queryParams.itemsLimit || 5, queryParams.transfersLimit || 5);

        return this.searchService.globalSearch(userId, request);
    }
}
