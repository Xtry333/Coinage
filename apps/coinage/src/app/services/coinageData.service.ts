import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
    BaseResponseDTO,
    CategoryDTO,
    ContractorDTO,
    SaveTransferDTO,
    SplitTransferDTO,
    TotalInMonthByCategory,
    TotalAmountPerMonthDTO,
    TransferDetailsDTO,
    TransferDTO,
    CreateEditCategoryDTO,
    CreateEditContractorDTO,
    AccountDTO,
    BalanceDTO,
    CreateInternalTransferDTOResponse,
    CreateInternalTransferDTO,
    RefundTransferDTO,
} from '@coinage-app/interfaces';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class CoinageDataService {
    public static readonly API_URL = '/api/';

    constructor(private http: HttpClient) {}

    public getBalanceForActiveAccounts(): Observable<BalanceDTO[]> {
        return this.http.get<BalanceDTO[]>(`${CoinageDataService.API_URL}dashboard/balance`);
    }

    public getAllTransfers(): Observable<TransferDTO[]> {
        return this.http.get<TransferDTO[]>(`${CoinageDataService.API_URL}transfer/all`);
    }

    public getRecentTransactions(): Observable<TransferDTO[]> {
        return this.http.get<TransferDTO[]>(`${CoinageDataService.API_URL}transfer/recent`);
    }

    public getTransferDetails(id: number): Promise<TransferDetailsDTO> {
        return this.http.get<TransferDetailsDTO>(`${CoinageDataService.API_URL}transfer/details/${id}`).toPromise();
    }

    public getTotalOutcomesPerMonth(): Observable<TotalAmountPerMonthDTO[]> {
        return this.http.get<TotalAmountPerMonthDTO[]>(`${CoinageDataService.API_URL}transfer/totalOutcomesPerMonth`);
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

    public postCreateSaveTransaction(request: SaveTransferDTO): Observable<BaseResponseDTO> {
        return this.http.post<BaseResponseDTO>(`${CoinageDataService.API_URL}transfer/save`, request);
    }

    public refundTransfer(transferId: number, arg1: Date) {
        const request: RefundTransferDTO = {
            refundTargetId: transferId,
            refundDate: arg1.toISOString().slice(0, 10),
        };
        return this.http.post<BaseResponseDTO>(`${CoinageDataService.API_URL}transfer/refund`, request);
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

    public getTotalPerCategory(year: number, month: number): Observable<TotalInMonthByCategory[]> {
        return this.http.get<TotalInMonthByCategory[]>(`${CoinageDataService.API_URL}category/totalPerCategory/${year}/${month}`);
    }
}
