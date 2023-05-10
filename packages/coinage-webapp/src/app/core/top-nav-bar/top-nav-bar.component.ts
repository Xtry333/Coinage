import { Component } from '@angular/core';
import { faUser } from '@fortawesome/free-solid-svg-icons';

import { NavigatorPages } from '../../services/navigator.service';

@Component({
    selector: 'app-top-nav-bar',
    templateUrl: './top-nav-bar.component.html',
    styleUrls: ['./top-nav-bar.component.scss'],
})
export class TopNavBarComponent {
    public NavigatorPages = NavigatorPages;

    public title = 'Coinage';

    public userIcon = faUser;
    public username = 'User';
    public dateTime = new Date().toLocaleString();
    public logo = 'assets/images/coin.png';
}
