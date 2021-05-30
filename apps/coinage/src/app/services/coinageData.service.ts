import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CategoryDTO, CreateTransferDTO, TotalInMonthByCategory, TotalOutcomesPerMonthDTO, TransferDetailsDTO, TransferDTO } from '@coinage-app/interfaces';
import { ApiPathsModule } from '@coinage-app/router';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class CoinageDataService {
    public static readonly API_URL = '/api/';

    constructor(private http: HttpClient, private path: ApiPathsModule) {}

    public getTransactionsObserver(): Observable<TransferDTO[]> {
        return this.http.get<TransferDTO[]>(this.path.getApiUrl());
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

    public postCreateTransaction(request: CreateTransferDTO): Observable<void> {
        return this.http.post<void>(`${CoinageDataService.API_URL}transfer/create`, request);
    }

    public getTotalPerCategory(year: number, month: number): Observable<TotalInMonthByCategory[]> {
        return this.http.get<TotalInMonthByCategory[]>(`${CoinageDataService.API_URL}category/totalPerCategory/${year}/${month}`);
    }
}
