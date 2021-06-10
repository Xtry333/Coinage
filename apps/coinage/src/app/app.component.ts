import { Component, OnDestroy, OnInit } from '@angular/core';
import { LoadingService } from './loaderGadget/loading.service';

@Component({
    selector: 'coinage-app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.less'],
})
export class AppComponent implements OnInit, OnDestroy {
    isPageLoading: boolean = true;
    title = 'Coinage';
    dateTime = new Date().toLocaleString();
    logo = 'assets/images/coin.png';
    refreshInterval?: ReturnType<typeof setInterval>;

    constructor(private loader: LoadingService) {}

    ngOnInit(): void {
        this.loader.loading$.subscribe((loading) => {
            this.isPageLoading = loading;
        });
        this.refreshInterval = setInterval(() => {
            this.dateTime = new Date().toLocaleString();
        }, 1000);
    }

    ngOnDestroy(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = undefined;
        }
    }
}
