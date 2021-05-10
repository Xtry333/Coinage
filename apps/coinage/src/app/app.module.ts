import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ApiPathsModule } from '@coinage-app/router';
import { AppRoutingModule } from './app-routing/app-routing.module';

import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';

@NgModule({
    declarations: [AppComponent, DashboardComponent],
    imports: [BrowserModule, HttpClientModule, AppRoutingModule, RouterModule],
    providers: [ApiPathsModule],
    bootstrap: [AppComponent],
})
export class AppModule {}
