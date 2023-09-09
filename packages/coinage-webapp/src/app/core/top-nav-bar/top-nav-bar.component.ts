import { Component, ElementRef, EventEmitter, HostListener, OnInit, Output, ViewChild } from '@angular/core';
import { faUser } from '@fortawesome/free-solid-svg-icons';

import { NavigatorPages } from '../../services/navigator.service';
import { CurrentUserDataService } from '../../services/current-user.service';
import { DropdownMenuComponent } from '../dropdown-menu/dropdown-menu.component';

@Component({
    selector: 'app-top-nav-bar',
    templateUrl: './top-nav-bar.component.html',
    styleUrls: ['./top-nav-bar.component.scss'],
})
export class TopNavBarComponent implements OnInit {
    public NavigatorPages = NavigatorPages;

    public title = 'Coinage';

    public userIcon = faUser;
    public username = 'User';
    public dateTime = new Date().toLocaleString();
    public logo = 'assets/images/coin.png';

    public isMobileNavMenuOpen = false;
    public isUserMenuOpen = false;

    @Output() public toggleOpenSidebar = new EventEmitter<boolean>(false);

    @ViewChild('dropdownUserMenuComponent')
    private dropdownUserMenuComponent?: DropdownMenuComponent;

    public constructor(private eRef: ElementRef, private readonly userDataService: CurrentUserDataService) {}

    public ngOnInit(): void {
        this.userDataService.userData$.subscribe((user) => {
            this.username = user['username'];
            this.dateTime = new Date(user['date'] ?? 0).toLocaleString();
            //console.log(user['date']);
        });
    }

    public onToggleOpenSidebar(): void {
        this.toggleOpenSidebar.emit(true);
    }

    public openUserMenuDropdown(): void {
        setTimeout(() => this.dropdownUserMenuComponent?.openDropdown());
    }
}
