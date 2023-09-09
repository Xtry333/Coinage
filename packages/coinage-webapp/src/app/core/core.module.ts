import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { BigCounterComponent } from './big-counter/big-counter.component';
import { DropdownMenuComponent } from './dropdown-menu/dropdown-menu.component';
import { PaginationComponent } from './pagination/pagination.component';
import { CoinageStorageService } from './services/storage-service/coinage-storage.service';
import { WindowService } from './services/window-service/window-service.service';
import { SidebarNavComponent } from './sidebar-nav/sidebar-nav.component';
import { TopNavBarComponent } from './top-nav-bar/top-nav-bar.component';
import { MathAbsPipe } from '../pipes/math-abs.pipe';
import { NullTransformPipe } from '../pipes/null-transform.pipe';
import { PlnCurrencyPipe } from '../pipes/pln-currency.pipe';
import { ReplacePipe } from '../pipes/replace.pipe';

const pipes = [PlnCurrencyPipe, ReplacePipe, MathAbsPipe];

@NgModule({
    imports: [CommonModule, RouterModule, FontAwesomeModule],
    declarations: [...pipes, NullTransformPipe, BigCounterComponent, PaginationComponent, TopNavBarComponent, SidebarNavComponent, DropdownMenuComponent],
    providers: [...pipes, WindowService, CoinageStorageService],
    exports: [
        ...pipes,
        NullTransformPipe,
        BigCounterComponent,
        PaginationComponent,
        TopNavBarComponent,
        SidebarNavComponent,
        DropdownMenuComponent,
        FontAwesomeModule,
        CommonModule
    ],
})
export class CoreModule {}
