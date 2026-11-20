import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { BaseChartDirective } from 'ng2-charts';

import { CoreModule } from '../core/core.module';
import { AppliedFiltersComponent } from './applied-filters/applied-filters.component';
import { AutoPaginationComponent } from './auto-pagination/auto-pagination.component';
import { BulkEditTransfersModalComponent } from './bulk-edit-transfers-modal/bulk-edit-transfers-modal.component';
import { ChartComponent } from './chart/chart.component';
import { ItemPackagingComponent } from './item-packaging/item-packaging.component';
import { ModalComponent } from './modal/modal.component';
import { MoneyAmountComponent } from './money-amount/money-amount.component';
import { PackagingSelectorComponent } from './packaging-selector/packaging-selector.component';
import { SectionComponent } from './section/section.component';
import { SharedContainerEditorComponent } from './shared-container-editor/shared-container-editor.component';
import { TagSelectorComponent } from './tag-selector/tag-selector.component';

@NgModule({
    imports: [CoreModule, NgSelectModule, FormsModule, BaseChartDirective],
    declarations: [
        SectionComponent,
        ModalComponent,
        ChartComponent,
        AutoPaginationComponent,
        MoneyAmountComponent,
        BulkEditTransfersModalComponent,
        AppliedFiltersComponent,
        TagSelectorComponent,
        ItemPackagingComponent,
        PackagingSelectorComponent,
        SharedContainerEditorComponent,
    ],
    exports: [
        SectionComponent,
        ModalComponent,
        ChartComponent,
        AutoPaginationComponent,
        MoneyAmountComponent,
        BulkEditTransfersModalComponent,
        AppliedFiltersComponent,
        TagSelectorComponent,
        ItemPackagingComponent,
        PackagingSelectorComponent,
        SharedContainerEditorComponent,
    ],
})
export class CommonComponentsModule {}
