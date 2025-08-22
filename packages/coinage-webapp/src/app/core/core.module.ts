import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { CurrencyPipe } from '../pipes/currency.pipe';
import { MathAbsPipe } from '../pipes/math-abs.pipe';
import { NullTransformPipe } from '../pipes/null-transform.pipe';
import { PlnCurrencyPipe } from '../pipes/pln-currency.pipe';
import { ReplacePipe } from '../pipes/replace.pipe';
import { BigCounterComponent } from './big-counter/big-counter.component';
import { DropdownMenuComponent } from './dropdown-menu/dropdown-menu.component';
import { PaginationComponent } from './pagination/pagination.component';
import { SearchComponent } from './search/search.component';
import { CoinageStorageService } from './services/storage-service/coinage-storage.service';
import { WindowService } from './services/window-service/window-service.service';
import { SidebarNavComponent } from './sidebar-nav/sidebar-nav.component';
import { TopNavBarComponent } from './top-nav-bar/top-nav-bar.component';

const pipes = [PlnCurrencyPipe, ReplacePipe, MathAbsPipe, CurrencyPipe];

@NgModule({
    imports: [CommonModule, RouterModule, FontAwesomeModule, FormsModule],
    declarations: [
        ...pipes,
        NullTransformPipe,
        BigCounterComponent,
        PaginationComponent,
        TopNavBarComponent,
        SidebarNavComponent,
        DropdownMenuComponent,
        SearchComponent,
    ],
    providers: [...pipes, WindowService, CoinageStorageService],
    exports: [
        ...pipes,
        NullTransformPipe,
        BigCounterComponent,
        PaginationComponent,
        TopNavBarComponent,
        SidebarNavComponent,
        DropdownMenuComponent,
        SearchComponent,
        FontAwesomeModule,
        CommonModule,
    ],
})
export class CoreModule {}
