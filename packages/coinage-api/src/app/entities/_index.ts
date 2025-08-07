import { Account } from './Account.entity';
import { Category } from './Category.entity';
import { Container } from './Container.entity';
import { Contractor } from './Contractor.entity';
import { Currency } from './Currency.entity';
import { Item } from './Item.entity';
import { Receipt } from './Receipt.entity';
import { Schedule } from './Schedule.entity';
import { Transfer } from './Transfer.entity';
import { TransferItem } from './TransferItem.entity';
import { User } from './User.entity';

import views from './views/_index';

export default [Container, Currency, Category, Contractor, Receipt, Transfer, Item, TransferItem, Account, User, Schedule, ...views];
