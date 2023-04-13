import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';

import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgSelectModule } from '@ng-select/ng-select';
import { Chart } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { NgChartsModule } from 'ng2-charts';
import { AppRoutingModule } from './app-routing/app-routing.module';
import { AppComponent } from './app.component';
import { CategoryListItemComponent } from './category-manager/category-list-item/category-list-item.component';
import { CategoryManagerComponent } from './category-manager/category-manager.component';
import { CreateEditCategoryComponent } from './category-manager/create-edit-category/create-edit-category.component';
import { AutoPaginationComponent } from './components/auto-pagination/auto-pagination.component';
import { ChartComponent } from './components/chart/chart.component';
import { ModalComponent } from './components/modal/modal.component';
import { CoreModule } from './core/core.module';
import { CreateEditTransferComponent } from './create-edit-transfer/create-edit-transfer.component';
import { ItemShoppingListComponent } from './create-edit-transfer/item-shopping-list/item-shopping-list.component';
import { DashboardCountersComponent } from './dashboard/dashboard-counters/dashboard-counters.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ChatComponent } from './demo/chat/chat.component';
import { NetworkInterceptor } from './loaderGadget/network.interceptor';
import { SpinnerComponent } from './loaderGadget/spinner/spinner.component';
import { MonthSummaryComponent } from './month-summary/month-summary.component';
import { NotificationComponent } from './notifications-container/notification/notification.component';
import { NotificationsContainerComponent } from './notifications-container/notifications-container.component';
import { AccountSettingsPageComponent } from './pages/account-settings-page/account-settings-page.component';
import { MathAbsPipe } from './pipes/math-abs.pipe';
import { NullTransformPipe } from './pipes/null-transform.pipe';
import { PlnCurrencyPipe } from './pipes/pln-currency.pipe';
import { ReplacePipe } from './pipes/replace.pipe';
import { ReceiptDetailsComponent } from './receipt-details/receipt-details.component';
import { StatisticsComponent } from './statistics/statistics.component';
import { ItemsTableComponent } from './transfer-details/items-table/items-table.component';
import { TransferDetailsComponent } from './transfer-details/transfer-details.component';
import { TransferItemDetailsComponent } from './transfer-item-details/transfer-item-details.component';
import { TransferItemsTableComponent } from './transfer-item-details/transfer-items-table/transfer-items-table.component';
import { TransfersListComponent } from './transfers-list/transfers-list.component';
import { TableFilterComponent } from './transfers-table/table-filter/table-filter.component';
import { TransfersTableComponent } from './transfers-table/transfers-table.component';

const pipes = [PlnCurrencyPipe, NullTransformPipe, ReplacePipe, MathAbsPipe];

const socketIoConfig: SocketIoConfig = {
    url: '/',
    options: {
        path: '/ws/',
        transports: ['websocket'],
        auth: {
            key: 'Key',
        },
    },
};
Chart.register(zoomPlugin);

@NgModule({
    imports: [
        BrowserModule,
        HttpClientModule,
        BrowserAnimationsModule,
        RouterModule,
        AppRoutingModule,
        NgSelectModule,
        FormsModule,
        FontAwesomeModule,
        NgChartsModule,
        SocketIoModule.forRoot(socketIoConfig),
        CoreModule,
    ],
    declarations: [
        ...pipes,
        AppComponent,
        DashboardComponent,
        MonthSummaryComponent,
        TransferDetailsComponent,
        ReceiptDetailsComponent,
        SpinnerComponent,
        CategoryManagerComponent,
        CreateEditTransferComponent,
        CategoryListItemComponent,
        TransfersTableComponent,
        ModalComponent,
        TransfersListComponent,
        TableFilterComponent,
        NotificationsContainerComponent,
        NotificationComponent,
        DashboardCountersComponent,
        StatisticsComponent,
        AutoPaginationComponent,
        CreateEditCategoryComponent,
        ChartComponent,
        ItemsTableComponent,
        ItemShoppingListComponent,
        AccountSettingsPageComponent,
        TransferItemDetailsComponent,
        TransferItemsTableComponent,
        ChatComponent,
    ],
    providers: [
        ...pipes,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: NetworkInterceptor,
            multi: true,
        },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
