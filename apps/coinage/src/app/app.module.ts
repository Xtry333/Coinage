import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ApiPathsModule } from '@coinage-app/router';
import { AppRoutingModule } from './app-routing/app-routing.module';

import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { NetworkInterceptor } from './loaderGadget/network.interceptor';
import { PlnCurrencyPipe } from './pipes/pln-currency.pipe';
import { TransferDetailsComponent } from './transfer-details/transfer-details.component';
import { SpinnerComponent } from './loaderGadget/spinner/spinner.component';

@NgModule({
    declarations: [
        AppComponent,
        DashboardComponent,
        PlnCurrencyPipe,
        TransferDetailsComponent,
        SpinnerComponent,
    ],
    imports: [BrowserModule, HttpClientModule, AppRoutingModule, RouterModule],
    providers: [
        ApiPathsModule,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: NetworkInterceptor,
            multi: true,
        },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
