import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CoinageRouteValues } from './app-routes';

const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
    },
    ...CoinageRouteValues,
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    declarations: [],
    exports: [],
})
export class AppRoutingModule {}
