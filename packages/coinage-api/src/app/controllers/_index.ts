import { AuthController } from '../auth/auth.controller';
import { AccountsController } from './accounts.controller';
import { CategoriesController } from './categories.controller';
import { ContainersController } from './containers.controller';
import { ContractorController } from './contractors.controller';
import { DashboardComponent } from './dashboard.controller';
import { ItemsController } from './items.controller';
import { ReceiptsController } from './receipts.controller';
import { SchedulesController } from './schedules.controller';
import { SearchController } from './search.controller';
import { TransferController } from './transfer.controller';
import { TransfersController } from './transfers.controller';
import { UserController } from './user/user.controller';

export default [
    AccountsController,
    CategoriesController,
    ContainersController,
    ContractorController,
    DashboardComponent,
    ReceiptsController,
    SchedulesController,
    SearchController,
    TransfersController,
    TransferController,
    ItemsController,
    UserController,
    AuthController,
];
