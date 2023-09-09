import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { Chart } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { NgChartsModule } from 'ng2-charts';
import { NgxPopperjsModule } from 'ngx-popperjs';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';

import { AppRoutingModule } from './app-routing/app-routing.module';
import { AppComponent } from './app.component';
import { CategoryListItemComponent } from './category-manager/category-list-item/category-list-item.component';
import { CategoryManagerComponent } from './category-manager/category-manager.component';
import { CreateEditCategoryComponent } from './category-manager/create-edit-category/create-edit-category.component';
import { CommonComponentsModule } from './components/common-components.module';
import { CoreModule } from './core/core.module';
import { CreateEditTransferComponent } from './create-edit-transfer/create-edit-transfer.component';
import { ItemShoppingListComponent } from './create-edit-transfer/item-shopping-list/item-shopping-list.component';
import { ItemizedTransfersModule } from './create-multiple-transfers/itemized-transfer.module';
import { ChatComponent } from './demo/chat/chat.component';
import { NetworkInterceptor } from './loaderGadget/network.interceptor';
import { SpinnerComponent } from './loaderGadget/spinner/spinner.component';
import { MonthSummaryComponent } from './month-summary/month-summary.component';
import { NotificationComponent } from './notifications-container/notification/notification.component';
import { NotificationsContainerComponent } from './notifications-container/notifications-container.component';
import { AccountSettingsPageComponent } from './pages/account-settings-page/account-settings-page.component';
import { DashboardCountersComponent } from './pages/dashboard/dashboard-counters/dashboard-counters.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ReceiptDetailsComponent } from './receipt-details/receipt-details.component';
import { StatisticsComponent } from './statistics/statistics.component';
import { ItemsTableComponent } from './transfer-details/items-table/items-table.component';
import { TransferDetailsComponent } from './transfer-details/transfer-details.component';
import { TransferItemDetailsComponent } from './transfer-item-details/transfer-item-details.component';
import { TransferItemsTableComponent } from './transfer-item-details/transfer-items-table/transfer-items-table.component';
import { TransfersListComponent } from './transfers-list/transfers-list.component';
import { TableFilterComponent } from './transfers-table/table-filter/table-filter.component';
import { TransfersTableComponent } from './transfers-table/transfers-table.component';

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
        CoreModule,
        CommonComponentsModule,
        ItemizedTransfersModule,
        NgxPopperjsModule,
        NgbModule,
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
    ],
    declarations: [
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
        TransfersListComponent,
        TableFilterComponent,
        NotificationsContainerComponent,
        NotificationComponent,
        DashboardCountersComponent,
        StatisticsComponent,
        CreateEditCategoryComponent,
        ItemsTableComponent,
        ItemShoppingListComponent,
        AccountSettingsPageComponent,
        TransferItemDetailsComponent,
        TransferItemsTableComponent,
        ChatComponent
    ],
    providers: [
        {
            provide: HTTP_INTERCEPTORS,
            useClass: NetworkInterceptor,
            multi: true,
        },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
