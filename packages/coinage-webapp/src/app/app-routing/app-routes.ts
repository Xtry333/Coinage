import { Routes } from '@angular/router';
import { LoginComponent } from '../auth/login/login.component.page';
import { CategoryManagerComponent } from '../category-manager/category-manager.component';
import { CreateEditTransferComponent } from '../create-edit-transfer/create-edit-transfer.component';
import { CreateMultipleTransfersComponent } from '../create-multiple-transfers/create-multiple-transfers.component';
import { ChatComponent } from '../demo/chat/chat.component';
import { MonthSummaryComponent } from '../month-summary/month-summary.component';
import { AccountDetailsPage } from '../pages/account-details-page/account-details-page.component';
import { AccountSettingsPageComponent } from '../pages/account-settings-page/account-settings-page.component';
import { DashboardComponent } from '../pages/dashboard/dashboard.component';
import { ReceiptDetailsComponent } from '../receipt-details/receipt-details.component';
import { TransferDetailsComponent } from '../transfer-details/transfer-details.component';
import { TransferItemDetailsComponent } from '../transfer-item-details/transfer-item-details.component';
import { TransfersListComponent } from '../transfers-list/transfers-list.component';
import { CoinageRoute } from './CoinageRoute.class';

export const CoinageRoutes = {
    LoginPage: new CoinageRoute('login', LoginComponent),
    NotFoundPage: new CoinageRoute('notFound', DashboardComponent),
    DashboardPage: new CoinageRoute('dashboard', DashboardComponent),
    AccountDetailsPage: new CoinageRoute('account/:id', AccountDetailsPage, {}, { id: 'number' }),
    TransferDetailsPage: new CoinageRoute('transfer/details/:id', TransferDetailsComponent, {}, { id: 'number' }),
    TransferItemDetailsPage: new CoinageRoute('item/details/:id', TransferItemDetailsComponent, {}, { id: 'number' }),
    ReceiptDetailsPage: new CoinageRoute('receipt/details/:id', ReceiptDetailsComponent, {}, { id: 'number' }),
    TransfersListPage: new CoinageRoute('transfers', TransfersListComponent),
    CreateTransferPage: new CoinageRoute('transfer/add', CreateEditTransferComponent),
    EditTransferPage: new CoinageRoute('transfer/edit/:id', CreateEditTransferComponent, {}, { id: 'number' }),
    CreateMultipleTransfersPage: new CoinageRoute('transfer/create', CreateMultipleTransfersComponent),
    SummaryPage: new CoinageRoute('summary/:month', MonthSummaryComponent, {}, { month: 'string' }),
    CategoryManagerPage: new CoinageRoute('manage/categories', CategoryManagerComponent),
    ManageAccountsPage: new CoinageRoute('manage/accounts', AccountSettingsPageComponent),
    AccountSettingsPage: new CoinageRoute('manage/account/:accountId', AccountSettingsPageComponent, {}, { accountId: 'number' }),
    ChatTestPage: new CoinageRoute('chat', ChatComponent),
};

export const CoinageRouteValues: Routes = Object.values(CoinageRoutes).map((page) => page.getRoute());
