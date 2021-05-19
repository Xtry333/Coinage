import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TotalOutcomesPerMonthDTO, TransferDetailsDTO, TransferDTO } from '@coinage-app/interfaces';
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
        return this.http.get<TransferDetailsDTO>(this.path.getTransfer(id)).toPromise();
    }

    public getTotalOutcomesPerMonth(): Observable<TotalOutcomesPerMonthDTO[]> {
        return this.http.get<TotalOutcomesPerMonthDTO[]>(CoinageDataService.API_URL + 'totalOutcomesPerMonth');
    }
}
