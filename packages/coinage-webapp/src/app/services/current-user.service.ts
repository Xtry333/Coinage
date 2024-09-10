import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, delay, lastValueFrom, Observable } from 'rxjs';
import { WebSocketService } from './web-socket.service';

export interface CurrentUserData {
    userId: number;
    username: string;
    accounts: any[];
}

@Injectable({
    providedIn: 'root',
})
export class CurrentUserDataService {
    private _userData = new BehaviorSubject<CurrentUserData>({
        userId: 0,
        username: '',
        accounts: [],
    });

    public readonly userData$; // = this._userData.asObservable().pipe(delay(0));
    private _dataLoaded = false;

    public constructor(
        private readonly http: HttpClient,
        private readonly webSocketService: WebSocketService,
    ) {
        //this.refreshUserData();
        this.userData$ = this.webSocketService.on('hello') as Observable<{
            [key: string]: any;
        }>;
    }

    public async refreshUserData(): Promise<void> {
        const user = await this.getData();
    }

    public get hasDataLoaded() {
        return this._dataLoaded;
    }

    private async getData() {
        const value = await lastValueFrom(this.http.get<any>(`/api/user/1`));
        this._userData.next(value);
        this._dataLoaded = true;
        return value;
    }
}
