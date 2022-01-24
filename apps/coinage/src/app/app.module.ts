import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgSelectModule } from '@ng-select/ng-select';

import { AppRoutingModule } from './app-routing/app-routing.module';
import { AppComponent } from './app.component';
import { CategoryListItemComponent } from './category-manager/category-list-item/category-list-item.component';
import { CategoryManagerComponent } from './category-manager/category-manager.component';
import { AutoPaginationComponent } from './components/auto-pagination/auto-pagination.component';
import { BigCounterComponent } from './components/big-counter/big-counter.component';
import { ModalComponent } from './components/modal/modal.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { CreateEditTransferComponent } from './create-edit-transfer/create-edit-transfer.component';
import { DashboardCountersComponent } from './dashboard/dashboard-counters/dashboard-counters.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { NetworkInterceptor } from './loaderGadget/network.interceptor';
import { SpinnerComponent } from './loaderGadget/spinner/spinner.component';
import { NotificationComponent } from './notifications-container/notification/notification.component';
import { NotificationsContainerComponent } from './notifications-container/notifications-container.component';
import { MathAbsPipe } from './pipes/math-abs.pipe';
import { NullTransformPipe } from './pipes/null-transform.pipe';
import { PlnCurrencyPipe } from './pipes/pln-currency.pipe';
import { ReplacePipe } from './pipes/replace.pipe';
import { ReceiptDetailsComponent } from './receipt-details/receipt-details.component';
import { StatisticsComponent } from './statistics/statistics.component';
import { SummaryComponent } from './summary/summary.component';
import { TransferDetailsComponent } from './transfer-details/transfer-details.component';
import { TableFilterComponent } from './transfer-table/table-filter/table-filter.component';
import { TransfersTableComponent } from './transfer-table/transfers-table.component';
import { TransfersListComponent } from './transfers-list/transfers-list.component';

const pipes = [PlnCurrencyPipe, NullTransformPipe, ReplacePipe, MathAbsPipe];

@NgModule({
    declarations: [
        ...pipes,
        AppComponent,
        DashboardComponent,
        SummaryComponent,
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
    ],
    imports: [BrowserModule, BrowserAnimationsModule, HttpClientModule, RouterModule, AppRoutingModule, NgSelectModule, FormsModule, FontAwesomeModule],
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
