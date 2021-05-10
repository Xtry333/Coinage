import { Component } from '@angular/core';
import { TransferDTO } from '@coinage-app/interfaces';
import { RestApiService } from './restapi.service';

@Component({
    selector: 'coinage-app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.less'],
})
export class AppComponent {
    title = 'Coinage';

    constructor(private restApiService: RestApiService) {}
}
