import { Routes } from '@angular/router';
import { authGuard } from '../auth/auth.guard';
import { LoginComponent } from '../auth/login/login.component.page';
import { CategoryManagerComponent } from '../category-manager/category-manager.component';
import { CreateEditTransferComponent } from '../create-edit-transfer/create-edit-transfer.component';
import { CreateMultipleTransfersComponent } from '../create-multiple-transfers/create-multiple-transfers.component';
import { ChatComponent } from '../demo/chat/chat.component';
import { MonthSummaryComponent } from '../month-summary/month-summary.component';
import { AccountDetailsPage } from '../pages/account-details-page/account-details-page.component';
import { AccountSettingsPageComponent } from '../pages/account-settings-page/account-settings-page.component';
import { DashboardComponent } from '../pages/dashboard/dashboard.component';
import { ItemsListPageComponent } from '../pages/items-list-page/items-list-page.component';
import { ReceiptDetailsComponent } from '../receipt-details/receipt-details.component';
import { TransferDetailsComponent } from '../transfer-details/transfer-details.component';
import { TransferItemDetailsComponent } from '../transfer-item-details/transfer-item-details.component';
import { TransfersListComponent } from '../transfers-list/transfers-list.component';
import { CoinageRoute } from './CoinageRoute.class';

const guarded = { canActivate: [authGuard] };

export const CoinageRoutes = {
    LoginPage: new CoinageRoute('login', LoginComponent),
    NotFoundPage: new CoinageRoute('notFound', DashboardComponent, guarded),
    DashboardPage: new CoinageRoute('dashboard', DashboardComponent, guarded),
    AccountDetailsPage: new CoinageRoute('account/:id', AccountDetailsPage, guarded, { id: 'number' }),
    TransferDetailsPage: new CoinageRoute('transfer/details/:id', TransferDetailsComponent, guarded, { id: 'number' }),
    TransferItemDetailsPage: new CoinageRoute('item/details/:id', TransferItemDetailsComponent, guarded, { id: 'number' }),
    ReceiptDetailsPage: new CoinageRoute('receipt/details/:id', ReceiptDetailsComponent, guarded, { id: 'number' }),
    TransfersListPage: new CoinageRoute('transfers', TransfersListComponent, guarded),
    ItemsListPage: new CoinageRoute('items', ItemsListPageComponent, guarded),
    CreateTransferPage: new CoinageRoute('transfer/add', CreateEditTransferComponent, guarded),
    EditTransferPage: new CoinageRoute('transfer/edit/:id', CreateEditTransferComponent, guarded, { id: 'number' }),
    CreateMultipleTransfersPage: new CoinageRoute('transfer/create', CreateMultipleTransfersComponent, guarded),
    SummaryPage: new CoinageRoute('summary/:month', MonthSummaryComponent, guarded, { month: 'string' }),
    CategoryManagerPage: new CoinageRoute('manage/categories', CategoryManagerComponent, guarded),
    ManageAccountsPage: new CoinageRoute('manage/accounts', AccountSettingsPageComponent, guarded),
    AccountSettingsPage: new CoinageRoute('manage/account/:accountId', AccountSettingsPageComponent, guarded, { accountId: 'number' }),
    ChatTestPage: new CoinageRoute('chat', ChatComponent, guarded),
};

export const CoinageRouteValues: Routes = Object.values(CoinageRoutes).map((page) => page.getRoute());
