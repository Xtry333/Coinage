import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { delay, startWith } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class LoadingService {
    private _loading = new BehaviorSubject<boolean>(false);
    public readonly loading$ = this._loading.asObservable().pipe(startWith(true), delay(0));

    public show() {
        this._loading.next(true);
    }

    public hide() {
        this._loading.next(false);
    }
}
