import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { BrowserModule } from '@angular/platform-browser';
import { TransferDetailsComponent } from '../transfer-details/transfer-details.component';

const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
    },
    {
        path: 'dashboard',
        component: DashboardComponent,
    },
    {
        path: 'details/:id',
        component: TransferDetailsComponent,
    },
];

@NgModule({
    declarations: [],
    imports: [BrowserModule, CommonModule, RouterModule.forRoot(routes)],
    exports: [],
})
export class AppRoutingModule {}
