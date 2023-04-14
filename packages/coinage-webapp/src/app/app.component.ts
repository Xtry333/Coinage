import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck, OnChanges, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { Socket } from 'ngx-socket-io';

import { CreateEditTransferComponent } from './create-edit-transfer/create-edit-transfer.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoadingService } from './loaderGadget/loading.service';
import { CoinageLocalStorageService } from './core/services/local-storage-service/coinage-local-storage.service';
import { CurrentUserDataService } from './services/current-user.service';
import { LangService } from './services/lang-service.service';
import { NavigatorPages } from './services/navigator.service';
import { NotificationService } from './services/notification.service';
import { WebSocketService } from './services/web-socket.service';
import { TransfersListComponent } from './transfers-list/transfers-list.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
    public static readonly KEY_LAST_USER_VISIT_DATE = 'last-visit-date';
    public static readonly KEY_FORCE_MOCK_USER = 'debug-user-id';
    public static readonly WELCOME_DELAY = 1000 * 60 * 60 * 12;

    public NavigatorPages = NavigatorPages;

    public userIcon = faUser;

    public isPageLoading = true;
    public title = 'Coinage';
    public username = 'User';
    public dateTime = new Date().toLocaleString();
    public logo = 'assets/images/coin.png';
    public refreshInterval?: ReturnType<typeof setInterval>;

    @ViewChild(CreateEditTransferComponent)
    public createEditTransferComponent!: CreateEditTransferComponent;

    public dashboardComponent?: DashboardComponent;
    public transfersListComponent?: TransfersListComponent;

    public isTrinketDisplayed = false;

    public constructor(
        private readonly loader: LoadingService,
        private readonly localStorageService: CoinageLocalStorageService,
        private readonly notificationService: NotificationService,
        private readonly socket: Socket,
        private readonly userDataService: CurrentUserDataService,
        private readonly webSocketService: WebSocketService,
        private readonly langService: LangService
    ) {}

    public ngOnInit(): void {
        console.log(this.langService);
        console.log(this);
        this.socket.on('connect', () => {
            this.notificationService.push({ message: 'Connection estabilished.', title: 'Server' });

            this.socket.emit('login', { userId: 1 }, (data: any) => console.log(data));
            this.socket.emit('events', { test: 'test' });
            this.socket.emit('identity', 0, (response: any) => console.log('Identity:', response));
        });

        this.socket.on('disconnect', () => {
            this.notificationService.push({ message: 'Disconnected. Server is down.', title: 'Server' });
        });

        this.socket.on('ping', (msg: any) => {
            console.log(msg);
        });

        this.loader.loading$.subscribe((loading) => {
            this.isPageLoading = loading;
        });

        this.refreshInterval = setInterval(() => {
            //this.dateTime = new Date().toLocaleString();
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
        this.userDataService.userData$.subscribe((user) => {
            this.username = user['username'];
            this.dateTime = new Date(user['date'] ?? 0).toLocaleString();
            //console.log(user['date']);
        });
    }

    public loginAs(id: number) {
        this.socket.emit('login', { userId: id }, (data: any) => console.log(data));
    }

    public onActivateRoute(component: Component): void {
        this.dashboardComponent = component instanceof DashboardComponent ? component : undefined;
        this.transfersListComponent = component instanceof TransfersListComponent ? component : undefined;
    }

    public ngOnDestroy(): void {
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
