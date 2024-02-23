import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { LoadingService } from './loading.service';
import { AuthService } from '../auth/auth.service';
import { CoinageStorageService } from '../core/services/storage-service/coinage-storage.service';
import { NavigatorService } from '../services/navigator.service';

@Injectable()
export class NetworkInterceptor implements HttpInterceptor {
    public constructor(private loader: LoadingService, private readonly storage: CoinageStorageService, private readonly navigatorService: NavigatorService) {}

    public intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        this.loader.show();
        request = request.clone({
            setHeaders: {
                authorization: `Bearer ${this.storage.getString(AuthService.USER_ACCESS_TOKEN)}`,
            },
        });
        return next.handle(request).pipe(
            catchError((error) => {
                console.log('Error:', error);
                this.navigatorService.navigateTo('login');
                throw error;
            }),
            finalize(() => {
                this.loader.hide();
            })
        );
    }
}
