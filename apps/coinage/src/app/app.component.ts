import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CreateEditTransferComponent } from './create-edit-transfer/create-edit-transfer.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoadingService } from './loaderGadget/loading.service';
import { CoinageLocalStorageService } from './services/coinage-local-storage.service';
import { NavigatorPages } from './services/navigator.service';
import { NotificationService } from './services/notification.service';
import { TransfersListComponent } from './transfers-list/transfers-list.component';

@Component({
    selector: 'coinage-app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
    public static readonly KEY_LAST_USER_VISIT_DATE = 'last-visit-date';
    public static readonly KEY_FORCE_MOCK_USER = 'debug-user-id';
    public static readonly WELCOME_DELAY = 1000 * 60 * 60 * 12;

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

    constructor(
        private readonly loader: LoadingService,
        private readonly localStorageService: CoinageLocalStorageService,
        private readonly notificationService: NotificationService
    ) {}

    ngOnInit(): void {
        this.loader.loading$.subscribe((loading) => {
            this.isPageLoading = loading;
        });

        this.refreshInterval = setInterval(() => {
            this.dateTime = new Date().toLocaleString();
        }, 1000);

        const lastVisit = this.localStorageService.getObject(AppComponent.KEY_LAST_USER_VISIT_DATE, (d) => new Date(d));
        this.localStorageService.setObject(AppComponent.KEY_LAST_USER_VISIT_DATE, new Date());
        setTimeout(() => {
            if (lastVisit && lastVisit.getTime() < new Date().getTime() - AppComponent.WELCOME_DELAY) {
                this.notificationService.push({ title: 'Welcome back!', message: `\nLast visit: ${(lastVisit ?? new Date()).toLocaleString()}` });
            } else if (!lastVisit) {
                this.notificationService.push({ title: 'Welcome!', message: `...` });
            }
        }, 1000);

        const mockUser = this.localStorageService.getNumber(AppComponent.KEY_FORCE_MOCK_USER);
        this.localStorageService.setNumber(AppComponent.KEY_FORCE_MOCK_USER, mockUser ?? 1);
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
