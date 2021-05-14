import { Component, OnDestroy, OnInit } from '@angular/core';
import { LoadingService } from './loaderGadget/loading.service';

@Component({
    selector: 'coinage-app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.less'],
})
export class AppComponent implements OnInit, OnDestroy {
    isPageLoading: boolean;
    title = 'Coinage';
    datetime = new Date();
    logo = 'assets/images/coin.png';
    refreshInterval: ReturnType<typeof setInterval>;

    constructor(private loader: LoadingService) {}

    ngOnInit(): void {
        this.loader.loading$.subscribe((loading) => {
            this.isPageLoading = loading;
        });
        this.refreshInterval = setInterval(() => {
            this.datetime = new Date();
        }, 1000);
    }

    ngOnDestroy(): void {
        clearInterval(this.refreshInterval);
    }
}
