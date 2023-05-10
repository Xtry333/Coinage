import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { BigCounterComponent } from './big-counter/big-counter.component';
import { PaginationComponent } from './pagination/pagination.component';
import { CoinageLocalStorageService } from './services/local-storage-service/coinage-local-storage.service';
import { WindowService } from './services/window-service/window-service.service';
import { TopNavBarComponent } from './top-nav-bar/top-nav-bar.component';

@NgModule({
    imports: [CommonModule, RouterModule, FontAwesomeModule],
    declarations: [BigCounterComponent, PaginationComponent, TopNavBarComponent],
    providers: [WindowService, CoinageLocalStorageService],
    exports: [BigCounterComponent, PaginationComponent, TopNavBarComponent],
})
export class CoreModule {}
