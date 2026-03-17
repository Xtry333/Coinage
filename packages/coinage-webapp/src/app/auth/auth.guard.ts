import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';

import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true;
    }

    return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
    });
};
