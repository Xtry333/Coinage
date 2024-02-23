import { Component } from '@angular/core';

import { AuthService } from '../auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
    public username: string;
    public password: string;

    public constructor(private readonly authService: AuthService) {
        this.username = '';
        this.password = '';
    }

    public onClickLogin() {
        this.authService.login(this.username, this.password);
    }
}
