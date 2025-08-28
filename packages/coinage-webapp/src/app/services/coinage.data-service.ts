import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { plainToInstance } from 'class-transformer';
import { Observable, lastValueFrom, map } from 'rxjs';

import {
    AccountDTO,
    BalanceDTO,
    BaseResponseDTO,
    BulkDeleteTransferDTO,
    BulkEditTransferDTO,
    CategoryDTO,
    ContainerDTO,
    ContractorDTO,
    CreateEditCategoryDTO,
    CreateEditContractorDTO,
    CreateEditItemDTO,
    CreateEditTransferModelDTO,
    CreateMultipleTransfersDTO,
    FilteredTransfersDTO,
    GetFilteredTransfersRequest,
    GranularCreateEditTransferModelDTO,
    ItemDetailsDTO,
    ItemWithContainerDTO,
    ItemWithLastUsedPriceDTO,
    NewMonthlyUserStatsDTO,
    ReceiptDetailsDTO,
    RefundTransferDTO,
    SplitTransferDTO,
    TotalInMonthByCategory,
    TransferDTO,
    TransferDetailsDTO,
} from '@app/interfaces';

@Injectable({
    providedIn: 'root',
})
export class CoinageDataService {
    public static readonly API_URL = '/api/';

    public constructor(private http: HttpClient) {
        console.log(this);
    }

    public getBalanceForActiveAccounts(date: Date): Observable<BalanceDTO[]> {
        return this.http.get<BalanceDTO[]>(
            `${CoinageDataService.API_URL}dashboard/balance/${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
                .getDate()
                .toString()
                .padStart(2, '0')}`,
        );
    }

    public getTodaySpendings(date: Date): Observable<BalanceDTO[]> {
        return this.http.get<BalanceDTO[]>(
            `${CoinageDataService.API_URL}accounts/spendings/${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
                .getDate()
                .toString()
                .padStart(2, '0')}`,
        );
    }

    public getAllFilteredTransfers(filterParams?: GetFilteredTransfersRequest): Promise<FilteredTransfersDTO> {
        const instance = plainToInstance(GetFilteredTransfersRequest, filterParams, {
            exposeUnsetFields: true,
            strategy: 'exposeAll',
            enableImplicitConversion: true,
        });
        return lastValueFrom(
            this.http
                .post<FilteredTransfersDTO>(`${CoinageDataService.API_URL}transfers/all`, instance)
                .pipe(map((t) => plainToInstance(FilteredTransfersDTO, t))),
        );
    }

    public getRecentTransactions(): Observable<TransferDTO[]> {
        return this.http.get<TransferDTO[]>(`${CoinageDataService.API_URL}transfers/recent`).pipe(map((t) => plainToInstance(TransferDTO, t)));
    }

    public getTransferDetails(transferId: number): Promise<TransferDetailsDTO> {
        return lastValueFrom(
            this.http
                .get<TransferDetailsDTO>(`${CoinageDataService.API_URL}transfer/${transferId}/details`)
                .pipe(map((t) => plainToInstance(TransferDetailsDTO, t))),
        );
    }

    public postCommitTransfer(transferId: number): Promise<BaseResponseDTO> {
        return lastValueFrom(this.http.post<BaseResponseDTO>(`${CoinageDataService.API_URL}transfer/${transferId}/commit`, {}));
    }

    public postStageTransfer(transferId: number): Promise<BaseResponseDTO> {
        return lastValueFrom(this.http.post<BaseResponseDTO>(`${CoinageDataService.API_URL}transfer/${transferId}/stage`, {}));
    }

    public getReceiptDetails(transferId: number): Promise<ReceiptDetailsDTO> {
        return lastValueFrom(
            this.http
                .get<ReceiptDetailsDTO>(`${CoinageDataService.API_URL}receipt/${transferId}/details`)
                .pipe(map((t) => plainToInstance(ReceiptDetailsDTO, t))),
        );
    }

    public getAccountMonthlyStats(): Observable<NewMonthlyUserStatsDTO[]> {
        return this.http.get<NewMonthlyUserStatsDTO[]>(`${CoinageDataService.API_URL}account/lastYearMonthlyStats`, {
            // params: { accountIds: [1] },
        });
    }

    public getCategoryTree(): Observable<CategoryDTO[]> {
        return this.http.get<CategoryDTO[]>(`${CoinageDataService.API_URL}category/tree`);
    }

    public getCategoryList(): Observable<CategoryDTO[]> {
        return this.http.get<CategoryDTO[]>(`${CoinageDataService.API_URL}category/list`);
    }

    public getContractorList(): Observable<ContractorDTO[]> {
        return this.http.get<ContractorDTO[]>(`${CoinageDataService.API_URL}contractor/list`);
    }

    public getContainerList(): Observable<ContainerDTO[]> {
        return this.http.get<ContainerDTO[]>(`${CoinageDataService.API_URL}containers`);
    }

    public getContainersUsedWithItem(itemId: number): Promise<ContainerDTO[]> {
        return lastValueFrom(this.http.get<ContainerDTO[]>(`${CoinageDataService.API_URL}containers/used-with-item/${itemId}`));
    }

    public getAllAvailableAccounts(): Observable<AccountDTO[]> {
        return this.http.get<AccountDTO[]>(`${CoinageDataService.API_URL}account/all`);
    }

    public getUserAccounts(): Promise<AccountDTO[]> {
        return lastValueFrom(this.http.get<AccountDTO[]>(`${CoinageDataService.API_URL}accounts/all`));
    }

    public postCreateSaveTransfer(request: CreateEditTransferModelDTO): Observable<BaseResponseDTO> {
        return this.http.post<BaseResponseDTO>(`${CoinageDataService.API_URL}transfer/save`, request);
    }

    public postGranularSaveTransfer(request: GranularCreateEditTransferModelDTO): Observable<BaseResponseDTO> {
        return this.http.post<BaseResponseDTO>(`${CoinageDataService.API_URL}transfer/save-granular`, request);
    }

    public postRefundTransfer(transferId: number, date: Date) {
        const request: RefundTransferDTO = {
            refundTargetId: transferId,
            refundDate: date.toISOString().slice(0, 10),
        };
        return this.http.post<BaseResponseDTO>(`${CoinageDataService.API_URL}transfer/${transferId}/refund`, request);
    }

    public postDuplicateTransfer(transferId: number) {
        return this.http.post<BaseResponseDTO>(`${CoinageDataService.API_URL}transfer/${transferId}/duplicate`, {});
    }

    public postCreateCategory(request: CreateEditCategoryDTO) {
        return this.http.post<BaseResponseDTO>(`${CoinageDataService.API_URL}category/save`, request);
    }

    public postCreateContractor(request: CreateEditContractorDTO) {
        console.log(request);
        return lastValueFrom(this.http.post<BaseResponseDTO>(`${CoinageDataService.API_URL}contractor/save`, request));
    }

    public postCreateItem(request: CreateEditItemDTO) {
        return lastValueFrom(this.http.post<BaseResponseDTO>(`${CoinageDataService.API_URL}item/save`, request));
    }

    public deleteTransfer(transferId: number): Observable<boolean> {
        return this.http.delete<boolean>(`${CoinageDataService.API_URL}transfer/${transferId}`);
    }

    public postSplitTransaction(transferId: number, request: SplitTransferDTO): Promise<BaseResponseDTO> {
        return lastValueFrom(this.http.post<BaseResponseDTO>(`${CoinageDataService.API_URL}transfer/${transferId}/split`, request));
    }

    public getTotalPerCategory(year: number, month: number, day?: number): Observable<TotalInMonthByCategory[]> {
        return this.http.get<TotalInMonthByCategory[]>(`${CoinageDataService.API_URL}category/totalPerCategory/${year}/${month}${day ? '/' + day : ''}`);
    }

    public getAllItems(): Promise<ItemWithLastUsedPriceDTO[]> {
        return lastValueFrom(this.http.get<ItemWithLastUsedPriceDTO[]>(`${CoinageDataService.API_URL}items/all`));
    }

    public getItems(): Observable<ItemWithLastUsedPriceDTO[]> {
        return this.http.get<ItemWithLastUsedPriceDTO[]>(`${CoinageDataService.API_URL}items/all`);
    }

    public getItemsWithContainers(): Observable<ItemWithContainerDTO[]> {
        return this.http.get<ItemWithContainerDTO[]>(`${CoinageDataService.API_URL}items/all/with-containers`);
    }

    public getItemDetails(id: number): Promise<ItemDetailsDTO> {
        return lastValueFrom(this.http.get<ItemDetailsDTO>(`${CoinageDataService.API_URL}item/${id}`).pipe(map((i) => plainToInstance(ItemDetailsDTO, i))));
    }

    public postCreateAdvancedTransfers(request: CreateMultipleTransfersDTO): Promise<BaseResponseDTO> {
        return lastValueFrom(this.http.post<BaseResponseDTO>(`${CoinageDataService.API_URL}transfer/createAdvanced`, request));
    }

    public async getServerDate(): Promise<Date> {
        const a = await lastValueFrom(this.http.get<Date>(`${CoinageDataService.API_URL}user/date`));
        console.log(a);
        return a;
    }

    public postBulkEditTransfers(request: BulkEditTransferDTO): Promise<BaseResponseDTO> {
        return lastValueFrom(this.http.post<BaseResponseDTO>(`${CoinageDataService.API_URL}transfers/bulk-edit`, request));
    }

    public postBulkDeleteTransfers(request: BulkDeleteTransferDTO): Promise<BaseResponseDTO> {
        return lastValueFrom(this.http.post<BaseResponseDTO>(`${CoinageDataService.API_URL}transfers/bulk-delete`, request));
    }
}
