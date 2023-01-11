import { Injectable } from '@angular/core';
import { LoadingService } from './loading.service';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { CoinageLocalStorageService } from '../services/coinage-local-storage.service';

@Injectable()
export class NetworkInterceptor implements HttpInterceptor {
    public constructor(private loader: LoadingService, private readonly storage: CoinageLocalStorageService) {}

    public intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        this.loader.show();
        request = request.clone({
            setHeaders: {
                authorization: `Bearer ${'TOKEN_TEST_123_USER_ID#'}${this.storage.getNumber('debug-user-id')}`,
            },
        });
        return next.handle(request).pipe(
            finalize(() => {
                this.loader.hide();
            })
        );
    }
}
