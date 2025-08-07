import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgChartsModule } from 'ng2-charts';

import { AutoPaginationComponent } from './auto-pagination/auto-pagination.component';
import { ChartComponent } from './chart/chart.component';
import { ModalComponent } from './modal/modal.component';
import { SectionComponent } from './section/section.component';
import { CoreModule } from '../core/core.module';
import { MoneyAmountComponent } from './money-amount/money-amount.component';

@NgModule({
    imports: [CoreModule, NgSelectModule, FormsModule, NgChartsModule],
    declarations: [SectionComponent, ModalComponent, ChartComponent, AutoPaginationComponent, MoneyAmountComponent],
    exports: [SectionComponent, ModalComponent, ChartComponent, AutoPaginationComponent, MoneyAmountComponent],
})
export class CommonComponentsModule {}
