import { AccountDao } from './account.dao';
import { BaseDao } from './base.dao';
import { CategoryDao } from './category.dao';
import { ContainerDao } from './container.dao';
import { ContractorDao } from './contractor.dao';
import { ItemDao } from './item.dao';
import { ReceiptDao } from './receipt.dao';
import { TransferDao } from './transfer.dao';
import { TransferItemDao } from './transferItem.dao';
import { UserDao } from './user.dao';

export default [BaseDao, AccountDao, CategoryDao, ContainerDao, ContractorDao, ReceiptDao, TransferDao, UserDao, ItemDao, TransferItemDao];
