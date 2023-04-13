import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BigCounterComponent } from './big-counter/big-counter.component';
import { PaginationComponent } from './pagination/pagination.component';
import { TopNavBarComponent } from './top-nav-bar/top-nav-bar.component';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
    imports: [CommonModule, RouterModule, FontAwesomeModule],
    declarations: [BigCounterComponent, PaginationComponent, TopNavBarComponent],
    exports: [BigCounterComponent, PaginationComponent, TopNavBarComponent],
})
export class CoreModule {}
