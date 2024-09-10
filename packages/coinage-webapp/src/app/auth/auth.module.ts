import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthDataService } from './auth.dataservice';
import { AuthService } from './auth.service';
import { LoginComponent } from './login/login.component.page';
import { CommonComponentsModule } from '../components/common-components.module';
import { CoreModule } from '../core/core.module';

@NgModule({
    imports: [CommonModule, CommonComponentsModule, CoreModule, FormsModule],
    declarations: [LoginComponent],
    providers: [AuthDataService, AuthService],
})
export class AuthModule {}
