import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

import { CreateMultipleTransfersComponent } from './create-multiple-transfers.component';
import { AddItemsToTransferComponent } from './item-details-for-transfer/item-details-for-transfer.component';
import { NewTransferDetailsComponent } from './new-transfer-details/new-transfer-details.component';
import { SelectedItemsComponent } from './selected-items/selected-items.component';
import { CommonComponentsModule } from '../components/common-components.module';
import { CoreModule } from '../core/core.module';

@NgModule({
    imports: [CoreModule, CommonComponentsModule, NgSelectModule, FormsModule],
    declarations: [CreateMultipleTransfersComponent, NewTransferDetailsComponent, AddItemsToTransferComponent, SelectedItemsComponent],
    exports: [CreateMultipleTransfersComponent],
})
export class ItemizedTransfersModule {}
