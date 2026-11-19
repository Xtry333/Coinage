import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom, timeout } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class AuthDataService {
    public constructor(
        private http: HttpClient,
        private httpBackend: HttpBackend,
    ) {}

    public login(username: string, password: string) {
        const body = { username, password };
        return lastValueFrom(this.http.post<{ token: string }>('/api/auth/login', body));
    }

    public forcedLogin() {
        // Bootstrap must not send an old session or trigger the interceptor's logout redirects.
        const http = new HttpClient(this.httpBackend);
        return lastValueFrom(http.post<{ token: string | null }>('/api/auth/forced-login', {}).pipe(timeout(5000)));
    }

    public logout() {
        return lastValueFrom(this.http.post<{ message: string }>('/api/auth/logout', {}));
    }
}
