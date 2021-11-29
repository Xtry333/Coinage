import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CreateEditTransferComponent } from './create-edit-transfer/create-edit-transfer.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoadingService } from './loaderGadget/loading.service';
import { CoinageLocalStorageService } from './services/coinage-local-storage.service';
import { NavigatorPages } from './services/navigator-service.service';
import { TransfersListComponent } from './transfers-list/transfers-list.component';

@Component({
    selector: 'coinage-app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
    public NavigatorPages = NavigatorPages;

    isPageLoading = true;
    title = 'Coinage';
    dateTime = new Date().toLocaleString();
    logo = 'assets/images/coin.png';
    refreshInterval?: ReturnType<typeof setInterval>;

    @ViewChild(CreateEditTransferComponent)
    createEditTransferComponent!: CreateEditTransferComponent;

    dashboardComponent?: DashboardComponent;
    transfersListComponent?: TransfersListComponent;

    isTrinketDisplayed = false;

    constructor(private readonly loader: LoadingService, private readonly localStorageService: CoinageLocalStorageService) {}

    ngOnInit(): void {
        this.loader.loading$.subscribe((loading) => {
            this.isPageLoading = loading;
        });
        this.refreshInterval = setInterval(() => {
            this.dateTime = new Date().toLocaleString();
        }, 1000);
    }

    onActivateRoute(component: Component): void {
        this.dashboardComponent = component instanceof DashboardComponent ? component : undefined;
        this.transfersListComponent = component instanceof TransfersListComponent ? component : undefined;
    }

    ngOnDestroy(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = undefined;
        }
    }

    public toggleTrinketModal(): void {
        if (this.isTrinketDisplayed) {
            this.hideTrinketModal();
        } else {
            this.showTrinketModal();
        }
        console.log(this);
    }

    public showTrinketModal(): void {
        this.isTrinketDisplayed = true;
    }

    public hideTrinketModal(): void {
        this.createEditTransferComponent.clearInputData();
        this.isTrinketDisplayed = false;
    }

    public forceDashboardRefresh(): void {
        this.dashboardComponent?.refreshData();
        this.transfersListComponent?.refreshData();
    }
}
