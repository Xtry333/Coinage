import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { LoadingService } from './loading.service';
import { AuthService } from '../auth/auth.service';
import { CoinageStorageService } from '../core/services/storage-service/coinage-storage.service';
import { NavigatorService } from '../services/navigator.service';
import { NotificationService } from '../services/notification.service';

@Injectable()
export class NetworkInterceptor implements HttpInterceptor {
    public constructor(
        private loader: LoadingService,
        private readonly storage: CoinageStorageService,
        private readonly navigatorService: NavigatorService,
        private readonly authService: AuthService,
        private readonly notificationService: NotificationService,
    ) {}

    public intercept(request: HttpRequest<unknown>, nextHandler: HttpHandler): Observable<HttpEvent<unknown>> {
        this.loader.show();
        if (this.authService.isAuthenticated()) {
            request = request.clone({
                setHeaders: {
                    authorization: this.authService.getAccessToken(),
                },
            });
        }

        return nextHandler.handle(request).pipe(
            catchError((error) => {
                if (error.status === HttpStatusCode.Unauthorized) {
                    this.authService.logout(true);
                    return throwError(error);
                } else {
                    console.log('Error:', error);
                    throw error;
                }
            }),
            finalize(() => {
                this.loader.hide();
            }),
        );
    }
}
