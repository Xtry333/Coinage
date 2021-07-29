import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
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
import { TransferTableComponent } from './transfer-table/transfer-table.component';
import { TrinketComponent } from './dashboard/trinket/trinket.component';
import { TransfersListComponent } from './transfers-list/transfers-list.component';
import { TableFilterComponent } from './transfer-table/table-filter/table-filter.component';
import { AppRoutingModule } from './app-routing/app-routing.module';

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
        TransferTableComponent,
        TrinketComponent,
        TransfersListComponent,
        TableFilterComponent,
    ],
    imports: [BrowserModule, HttpClientModule, RouterModule, AppRoutingModule, NgSelectModule, FormsModule, FontAwesomeModule],
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
