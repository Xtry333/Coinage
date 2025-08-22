import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GlobalSearchItemResult, GlobalSearchResponse, GlobalSearchTransferResult } from '@app/interfaces';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class SearchService {
    private apiUrl = '/api/search';

    constructor(private http: HttpClient) {}

    public globalSearch(query: string, itemsLimit: number = 5, transfersLimit: number = 5): Observable<GlobalSearchResponse> {
        const params = new HttpParams().set('query', query).set('itemsLimit', itemsLimit.toString()).set('transfersLimit', transfersLimit.toString());

        return this.http.get<any>(`${this.apiUrl}/global`, { params }).pipe(
            map((response) => {
                // Transform the response to ensure proper class instances
                const items = response.items?.map((item: any) => new GlobalSearchItemResult(item.id, item.name, item.brand, item.categoryName)) || [];

                const transfers =
                    response.transfers?.map(
                        (transfer: any) =>
                            new GlobalSearchTransferResult(
                                transfer.id,
                                transfer.description,
                                transfer.amount,
                                transfer.currencySymbol,
                                new Date(transfer.date),
                                transfer.categoryName,
                                transfer.contractorName,
                            ),
                    ) || [];

                return new GlobalSearchResponse(items, transfers);
            }),
        );
    }
}
