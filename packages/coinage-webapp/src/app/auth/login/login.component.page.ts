import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { NavigatorService } from '../../app-routing/navigator.service';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    standalone: false,
})
export class LoginComponent {
    public username: string;
    public password: string;

    private returnUrl: string;

    public constructor(
        private readonly authService: AuthService,
        private readonly navigatorService: NavigatorService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
    ) {
        this.username = '';
        this.password = '';
        this.returnUrl = this.resolveReturnUrl(this.route.snapshot.queryParams['returnUrl']);
    }

    public async onClickLogin() {
        await this.authService.login(this.username, this.password);
        this.navigatorService.navigateTo(this.returnUrl);
    }

    private resolveReturnUrl(url: string | undefined): string {
        const fallback = '/dashboard';
        if (!url) return fallback;

        try {
            const parsed = this.router.parseUrl(url);
            const matched = this.router.config.some((route) => {
                if (!route.path) return false;
                // Build a regex from the route path, treating :param segments as wildcards
                const pattern = new RegExp('^/?' + route.path.replace(/:[\w]+/g, '[^/]+') + '(/.*)?$');
                return pattern.test(parsed.toString());
            });
            return matched ? url : fallback;
        } catch {
            return fallback;
        }
    }
}
