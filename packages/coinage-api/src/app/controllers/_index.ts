import { AuthController } from '../auth/auth.controller';
import { AccountsController } from './accounts.controller';
import { CategoriesController } from './categories.controller';
import { ContractorController } from './contractors.controller';
import { DashboardComponent } from './dashboard.controller';
import { ItemsController } from './items.controller';
import { ReceiptsController } from './receipts.controller';
import { SearchController } from './search.controller';
import { TransferController } from './transfer.controller';
import { TransfersController } from './transfers.controller';
import { UserController } from './user/user.controller';

export default [
    AccountsController,
    CategoriesController,
    ContractorController,
    DashboardComponent,
    ReceiptsController,
    SearchController,
    TransfersController,
    TransferController,
    ItemsController,
    UserController,
    AuthController,
];
