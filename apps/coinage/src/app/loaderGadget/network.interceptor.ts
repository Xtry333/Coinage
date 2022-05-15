import { Injectable } from '@angular/core';
import { LoadingService } from './loading.service';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Injectable()
export class NetworkInterceptor implements HttpInterceptor {
    public constructor(private loader: LoadingService) {}

    public intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        this.loader.show();
        request = request.clone({
            setHeaders: {
                authorization: `Bearer ${'TOKEN_TEST_!@#_123'}`,
            },
        });
        return next.handle(request).pipe(
            finalize(() => {
                this.loader.hide();
            })
        );
    }
}
