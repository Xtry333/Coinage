import {
    AccountDTO,
    BalanceDTO,
    BaseResponseDTO,
    CategoryDTO,
    ContractorDTO,
    CreateEditCategoryDTO,
    CreateEditContractorDTO,
    CreateEditTransferModelDTO,
    CreateInternalTransferDTO,
    CreateInternalTransferDTOResponse,
    FilteredTransfersDTO,
    GetFilteredTransfersRequest,
    MonthlyUserStatsDTO,
    ReceiptDetailsDTO,
    RefundTransferDTO,
    SaveTransferDTO,
    SplitTransferDTO,
    TotalInMonthByCategory,
    TransferDTO,
    TransferDetailsDTO,
} from '@coinage-app/interfaces';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { plainToClass, plainToInstance } from 'class-transformer';

import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class CoinageDataService {
    public static readonly API_URL = '/api/';

    constructor(private http: HttpClient) {}

    public getBalanceForActiveAccounts(date: Date): Observable<BalanceDTO[]> {
        return this.http.get<BalanceDTO[]>(
            `${CoinageDataService.API_URL}dashboard/balance/${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
                .getDate()
                .toString()
                .padStart(2, '0')}`
        );
    }

    public getTodaySpendings(date: Date): Observable<BalanceDTO[]> {
        return this.http.get<BalanceDTO[]>(
            `${CoinageDataService.API_URL}accounts/spendings/${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
                .getDate()
                .toString()
                .padStart(2, '0')}`
        );
    }

    public getAllTransfers(filterParams?: GetFilteredTransfersRequest): Observable<FilteredTransfersDTO> {
        return this.http
            .post<FilteredTransfersDTO>(`${CoinageDataService.API_URL}transfer/all`, filterParams)
            .pipe(map((t) => plainToInstance(FilteredTransfersDTO, t)));
    }

    public getRecentTransactions(): Observable<TransferDTO[]> {
        return this.http.get<TransferDTO[]>(`${CoinageDataService.API_URL}transfer/recent`).pipe(map((t) => plainToInstance(TransferDTO, t)));
    }

    public getTransferDetails(id: number): Observable<TransferDetailsDTO> {
        return this.http.get<TransferDetailsDTO>(`${CoinageDataService.API_URL}transfer/details/${id}`);
    }

    public getReceiptDetails(id: number): Observable<ReceiptDetailsDTO> {
        return this.http.get<ReceiptDetailsDTO>(`${CoinageDataService.API_URL}receipt/details/${id}`);
    }

    public getAccountMonthlyStats(): Observable<MonthlyUserStatsDTO[]> {
        return this.http.get<MonthlyUserStatsDTO[]>(`${CoinageDataService.API_URL}account/lastYearMonthlyStats`, {
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

    public getAllAvailableAccounts(): Observable<AccountDTO[]> {
        return this.http.get<AccountDTO[]>(`${CoinageDataService.API_URL}account/all`);
    }

    public postCreateSaveTransaction(request: CreateEditTransferModelDTO): Observable<BaseResponseDTO> {
        return this.http.post<BaseResponseDTO>(`${CoinageDataService.API_URL}transfer/save`, request);
    }

    public refundTransfer(transferId: number, arg1: Date) {
        const request: RefundTransferDTO = {
            refundTargetId: transferId,
            refundDate: arg1.toISOString().slice(0, 10),
        };
        return this.http.post<BaseResponseDTO>(`${CoinageDataService.API_URL}transfer/${transferId}/refund`, request);
    }

    public duplicateTransfer(transferId: number) {
        return this.http.post<BaseResponseDTO>(`${CoinageDataService.API_URL}transfer/${transferId}/duplicate`, {});
    }

    public postCreateInternalTransfer(request: CreateInternalTransferDTO, originAccountId: number, targetAccountId: number) {
        return this.http.post<CreateInternalTransferDTOResponse>(
            `${CoinageDataService.API_URL}transfer/create/internal/${originAccountId}/${targetAccountId}`,
            request
        );
    }

    public postCreateCategory(request: CreateEditCategoryDTO) {
        return this.http.post<BaseResponseDTO>(`${CoinageDataService.API_URL}category/save`, request);
    }

    public postCreateContractor(request: CreateEditContractorDTO) {
        return this.http.post<BaseResponseDTO>(`${CoinageDataService.API_URL}contractor/save`, request);
    }

    public deleteTransfer(id: number): Observable<boolean> {
        return this.http.delete<boolean>(`${CoinageDataService.API_URL}transfer/${id}`);
    }

    public postSplitTransaction(request: SplitTransferDTO): Observable<BaseResponseDTO> {
        return this.http.post<BaseResponseDTO>(`${CoinageDataService.API_URL}transfer/split`, request);
    }

    public getTotalPerCategory(year: number, month: number, day?: number): Observable<TotalInMonthByCategory[]> {
        return this.http.get<TotalInMonthByCategory[]>(`${CoinageDataService.API_URL}category/totalPerCategory/${year}/${month}${day ? '/' + day : ''}`);
    }
}
