import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

import { CreateMultipleTransfersComponent } from './create-multiple-transfers.component';
import { NewTransferDetailsComponent } from './new-transfer-details/new-transfer-details.component';
import { CommonComponentsModule } from '../components/common-components.module';
import { CoreModule } from '../core/core.module';

@NgModule({
    imports: [CoreModule, CommonComponentsModule, NgSelectModule, FormsModule],
    declarations: [NewTransferDetailsComponent, CreateMultipleTransfersComponent],
    exports: [CreateMultipleTransfersComponent],
})
export class ItemizedTransfersModule {}
