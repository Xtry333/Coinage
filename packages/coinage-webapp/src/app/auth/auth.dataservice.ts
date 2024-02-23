import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class AuthDataService {
    public constructor(private http: HttpClient) {}

    public login(username: string, password: string) {
        const body = { username, password };
        return lastValueFrom(this.http.post<{ token: string }>('/api/auth/login', body));
    }
}
