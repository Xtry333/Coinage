import { AccountDao } from './account.dao';
import { BaseDao } from './base.bao';
import { CategoryDao } from './category.dao';
import { ContractorDao } from './contractor.dao';
import { ItemDao } from './item.dao';
import { ReceiptDao } from './receipt.dao';
import { TransferDao } from './transfer.dao';
import { UserDao } from './user.dao';

export default [BaseDao, AccountDao, CategoryDao, ContractorDao, ReceiptDao, TransferDao, UserDao, ItemDao];
