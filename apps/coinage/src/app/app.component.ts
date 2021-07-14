import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CreateEditTransferComponent } from './create-edit-transfer/create-edit-transfer.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoadingService } from './loaderGadget/loading.service';
import { TransfersListComponent } from './transfers-list/transfers-list.component';

@Component({
    selector: 'coinage-app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.less'],
})
export class AppComponent implements OnInit, OnDestroy {
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

    constructor(private loader: LoadingService) {}

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