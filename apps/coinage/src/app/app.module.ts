import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing/app-routing.module';
import { AutoPaginationComponent } from './components/auto-pagination/auto-pagination.component';
import { BigCounterComponent } from './components/big-counter/big-counter.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { CategoryListItemComponent } from './category-manager/category-list-item/category-list-item.component';
import { CategoryManagerComponent } from './category-manager/category-manager.component';
import { Chart } from 'chart.js';
import { ChartComponent } from './components/chart/chart.component';
import { CreateEditCategoryComponent } from './category-manager/create-edit-category/create-edit-category.component';
import { CreateEditTransferComponent } from './create-edit-transfer/create-edit-transfer.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DashboardCountersComponent } from './dashboard/dashboard-counters/dashboard-counters.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { MathAbsPipe } from './pipes/math-abs.pipe';
import { ModalComponent } from './components/modal/modal.component';
import { MonthSummaryComponent } from './month-summary/month-summary.component';
import { NetworkInterceptor } from './loaderGadget/network.interceptor';
import { NgChartsModule } from 'ng2-charts';
import { NgModule } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { NotificationComponent } from './notifications-container/notification/notification.component';
import { NotificationsContainerComponent } from './notifications-container/notifications-container.component';
import { NullTransformPipe } from './pipes/null-transform.pipe';
import { PaginationComponent } from './components/pagination/pagination.component';
import { PlnCurrencyPipe } from './pipes/pln-currency.pipe';
import { ReceiptDetailsComponent } from './receipt-details/receipt-details.component';
import { ReplacePipe } from './pipes/replace.pipe';
import { RouterModule } from '@angular/router';
import { SpinnerComponent } from './loaderGadget/spinner/spinner.component';
import { StatisticsComponent } from './statistics/statistics.component';
import { TableFilterComponent } from './transfers-table/table-filter/table-filter.component';
import { TransferDetailsComponent } from './transfer-details/transfer-details.component';
import { TransfersListComponent } from './transfers-list/transfers-list.component';
import { TransfersTableComponent } from './transfers-table/transfers-table.component';
import zoomPlugin from 'chartjs-plugin-zoom';
import { ItemsTableComponent } from './transfer-details/items-table/items-table.component';
import { ItemShoppingListComponent } from './create-edit-transfer/item-shopping-list/item-shopping-list.component';
import { EditableShopListItemComponent } from './create-edit-transfer/item-shopping-list/editable-shop-list-item/editable-shop-list-item.component';
import { AccountSettingsPageComponent } from './pages/account-settings-page/account-settings-page.component';

const pipes = [PlnCurrencyPipe, NullTransformPipe, ReplacePipe, MathAbsPipe];

const socketIoConfig: SocketIoConfig = { url: '/', options: {} };
Chart.register(zoomPlugin);

@NgModule({
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
        BigCounterComponent,
        DashboardCountersComponent,
        StatisticsComponent,
        PaginationComponent,
        AutoPaginationComponent,
        CreateEditCategoryComponent,
        ChartComponent,
        ItemsTableComponent,
        ItemShoppingListComponent,
        EditableShopListItemComponent,
        AccountSettingsPageComponent,
    ],
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
