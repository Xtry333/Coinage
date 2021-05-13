import { Component, OnDestroy, OnInit } from '@angular/core';
import { LoadingService } from './loading.service';
import { RestApiService } from './restapi.service';

@Component({
    selector: 'coinage-app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.less'],
})
export class AppComponent implements OnInit, OnDestroy {
    title = 'Coinage';
    isLoading: boolean;
    datetime = new Date();
    logo = 'assets/images/coin.png';
    refreshInterval: ReturnType<typeof setTimeout>;

    constructor(
        private restApiService: RestApiService,
        private loader: LoadingService
    ) {}

    ngOnInit(): void {
        this.loader.loading$.subscribe((loading) => {
            this.isLoading = loading;
        });
        this.refreshInterval = setInterval(() => {
            this.datetime = new Date();
        }, 1000);
    }

    ngOnDestroy(): void {
        clearInterval(this.refreshInterval);
    }
}
