import { RouterModule, Routes } from '@angular/router';

import { CategoryManagerComponent } from '../category-manager/category-manager.component';
import { CreateEditTransferComponent } from '../create-edit-transfer/create-edit-transfer.component';
import { DashboardComponent } from '../pages/dashboard/dashboard.component';
import { MonthSummaryComponent } from '../month-summary/month-summary.component';
import { NgModule } from '@angular/core';
import { ReceiptDetailsComponent } from '../receipt-details/receipt-details.component';
import { TransferDetailsComponent } from '../transfer-details/transfer-details.component';
import { TransfersListComponent } from '../transfers-list/transfers-list.component';
import { AccountSettingsPageComponent } from '../pages/account-settings-page/account-settings-page.component';
import { TransferItemDetailsComponent } from '../transfer-item-details/transfer-item-details.component';
import { ChatComponent } from '../demo/chat/chat.component';
import { CreateMultipleTransfersComponent } from '../create-multiple-transfers/create-multiple-transfers.component';

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
        path: 'item/details/:id',
        component: TransferItemDetailsComponent,
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
        path: 'transfer/create',
        component: CreateMultipleTransfersComponent,
    },
    {
        path: 'transfer/edit/:id',
        component: CreateEditTransferComponent,
    },
    {
        path: 'summary/:month',
        component: MonthSummaryComponent,
    },
    {
        path: 'manage/categories',
        component: CategoryManagerComponent,
    },
    {
        path: 'manage/accounts',
        component: AccountSettingsPageComponent,
    },
    {
        path: 'manage/account/:accountId',
        component: AccountSettingsPageComponent,
    },
    {
        path: 'chat',
        component: ChatComponent,
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    declarations: [],
    exports: [],
})
export class AppRoutingModule {}
