import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
    BaseResponseDTO,
    CategoryDTO,
    ContractorDTO,
    SaveTransferDTO,
    SplitTransferDTO,
    TotalInMonthByCategory,
    TotalOutcomesPerMonthDTO,
    TransferDetailsDTO,
    TransferDTO,
} from '@coinage-app/interfaces';
import { ApiPathsModule } from '@coinage-app/router';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class CoinageDataService {
    public static readonly API_URL = '/api/';

    constructor(private http: HttpClient, private path: ApiPathsModule) {}

    public getAllTransfers(): Observable<TransferDTO[]> {
        return this.http.get<TransferDTO[]>(`${CoinageDataService.API_URL}transfer/all`);
    }

    public getRecentTransactions(): Observable<TransferDTO[]> {
        return this.http.get<TransferDTO[]>(`${CoinageDataService.API_URL}transfer/recent`);
    }

    public getTransferDetails(id: number): Promise<TransferDetailsDTO> {
        return this.http.get<TransferDetailsDTO>(`${CoinageDataService.API_URL}transfer/details/${id}`).toPromise();
    }

    public getTotalOutcomesPerMonth(): Observable<TotalOutcomesPerMonthDTO[]> {
        return this.http.get<TotalOutcomesPerMonthDTO[]>(`${CoinageDataService.API_URL}transfer/totalOutcomesPerMonth`);
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

    public postCreateSaveTransaction(request: SaveTransferDTO): Observable<BaseResponseDTO> {
        return this.http.post<BaseResponseDTO>(`${CoinageDataService.API_URL}transfer/save`, request);
    }

    deleteTransfer(id: number): Observable<boolean> {
        return this.http.delete<boolean>(`${CoinageDataService.API_URL}transfer/${id}`);
    }

    public postSplitTransaction(request: SplitTransferDTO): Observable<BaseResponseDTO> {
        return this.http.post<BaseResponseDTO>(`${CoinageDataService.API_URL}transfer/split`, request);
    }

    public getTotalPerCategory(year: number, month: number): Observable<TotalInMonthByCategory[]> {
        return this.http.get<TotalInMonthByCategory[]>(`${CoinageDataService.API_URL}category/totalPerCategory/${year}/${month}`);
    }
}