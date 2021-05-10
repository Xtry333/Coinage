import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TransferDTO } from '@coinage-app/interfaces';
import { ApiPathsModule } from '@coinage-app/router';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class RestApiService {
    constructor(private http: HttpClient, private path: ApiPathsModule) {}

    getTransactionsObserver(): Observable<TransferDTO[]> {
        return this.http.get<TransferDTO[]>(this.path.getApiUrl());
    }

    getTransfer(id: number): Promise<TransferDTO> {
        return this.http
            .get<TransferDTO>(this.path.getTransfer(id))
            .toPromise();
    }
}
