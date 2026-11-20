import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CommonComponentsModule } from '../components/common-components.module';
import { CoreModule } from '../core/core.module';
import { AuthDataService } from './auth.dataservice';
import { AuthService } from './auth.service';
import { developmentAuthProviders } from './development-auth';
import { LoginComponent } from './login/login.component.page';

@NgModule({
    imports: [CommonModule, CommonComponentsModule, CoreModule, FormsModule],
    declarations: [LoginComponent],
    providers: [AuthDataService, AuthService, ...developmentAuthProviders],
})
export class AuthModule {}
