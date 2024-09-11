import { Component } from '@angular/core';

import { NavigatorService } from '../../app-routing/navigator.service';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
    public username: string;
    public password: string;

    public constructor(
        private readonly authService: AuthService,
        private readonly navigatorService: NavigatorService,
    ) {
        this.username = '';
        this.password = '';
    }

    public async onClickLogin() {
        await this.authService.login(this.username, this.password);
        this.navigatorService.navigateTo('dashboard');
    }
}
