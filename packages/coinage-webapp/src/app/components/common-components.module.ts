import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgChartsModule } from 'ng2-charts';

import { CoreModule } from '../core/core.module';
import { AutoPaginationComponent } from './auto-pagination/auto-pagination.component';
import { BulkEditTransfersModalComponent } from './bulk-edit-transfers-modal/bulk-edit-transfers-modal.component';
import { ChartComponent } from './chart/chart.component';
import { ModalComponent } from './modal/modal.component';
import { MoneyAmountComponent } from './money-amount/money-amount.component';
import { SectionComponent } from './section/section.component';

@NgModule({
    imports: [CoreModule, NgSelectModule, FormsModule, NgChartsModule],
    declarations: [SectionComponent, ModalComponent, ChartComponent, AutoPaginationComponent, MoneyAmountComponent, BulkEditTransfersModalComponent],
    exports: [SectionComponent, ModalComponent, ChartComponent, AutoPaginationComponent, MoneyAmountComponent, BulkEditTransfersModalComponent],
})
export class CommonComponentsModule {}
