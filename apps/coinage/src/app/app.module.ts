import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { NetworkInterceptor } from './loaderGadget/network.interceptor';
import { PlnCurrencyPipe } from './pipes/pln-currency.pipe';
import { TransferDetailsComponent } from './transfer-details/transfer-details.component';
import { SpinnerComponent } from './loaderGadget/spinner/spinner.component';
import { CategoryManagerComponent } from './category-manager/category-manager.component';
import { SummaryComponent } from './summary/summary.component';
import { CreateEditTransferComponent } from './create-edit-transfer/create-edit-transfer.component';
import { CategoryListItemComponent } from './category-manager/category-list-item/category-list-item.component';
import { TransfersTableComponent } from './transfer-table/transfers-table.component';
import { ModalComponent } from './components/modal/modal.component';
import { TransfersListComponent } from './transfers-list/transfers-list.component';
import { TableFilterComponent } from './transfer-table/table-filter/table-filter.component';
import { AppRoutingModule } from './app-routing/app-routing.module';
import { NotificationsContainerComponent } from './notifications-container/notifications-container.component';
import { NotificationComponent } from './notifications-container/notification/notification.component';
import { BigCounterComponent } from './components/big-counter/big-counter.component';
import { DashboardCountersComponent } from './dashboard/dashboard-counters/dashboard-counters.component';
import { StatisticsComponent } from './statistics/statistics.component';

@NgModule({
    declarations: [
        AppComponent,
        DashboardComponent,
        SummaryComponent,
        PlnCurrencyPipe,
        TransferDetailsComponent,
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
    ],
    imports: [BrowserModule, BrowserAnimationsModule, HttpClientModule, RouterModule, AppRoutingModule, NgSelectModule, FormsModule, FontAwesomeModule],
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
