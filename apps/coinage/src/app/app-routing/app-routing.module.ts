import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { BrowserModule } from '@angular/platform-browser';
import { TransferDetailsComponent } from '../transfer-details/transfer-details.component';
import { CategoryManagerComponent } from '../category-manager/category-manager.component';
import { SummaryComponent } from '../summary/summary.component';
import { CreateEditTransferComponent } from '../create-edit-transfer/create-edit-transfer.component';
import { TransfersListComponent } from '../transfers-list/transfers-list.component';
import { ReceiptDetailsComponent } from '../receipt-details/receipt-details.component';

const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
    },
    {
        path: 'notFound',
        component: DashboardComponent,
    },
    {
        path: 'dashboard',
        component: DashboardComponent,
    },
    {
        path: 'transfer/details/:id',
        component: TransferDetailsComponent,
    },
    {
        path: 'receipt/details/:id',
        component: ReceiptDetailsComponent,
    },
    {
        path: 'transfers',
        component: TransfersListComponent,
    },
    {
        path: 'transfer/add',
        component: CreateEditTransferComponent,
    },
    {
        path: 'transfer/edit/:id',
        component: CreateEditTransferComponent,
    },
    {
        path: 'summary/:partialDate',
        component: SummaryComponent,
    },
    {
        path: 'manage/categories',
        component: CategoryManagerComponent,
    },
];

@NgModule({
    declarations: [],
    imports: [BrowserModule, CommonModule, RouterModule.forRoot(routes)],
    exports: [],
})
export class AppRoutingModule {}
