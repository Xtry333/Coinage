import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { faBars, faBell, faUser, faXmark } from '@fortawesome/free-solid-svg-icons';

import { CurrentUserDataService } from '../../services/current-user.service';
import { DropdownMenuComponent } from '../dropdown-menu/dropdown-menu.component';

@Component({
    selector: 'app-top-nav-bar',
    templateUrl: './top-nav-bar.component.html',
    styleUrls: ['./top-nav-bar.component.scss'],
    standalone: false,
})
export class TopNavBarComponent implements OnInit {
    public title = 'Coinage';

    public userIcon = faUser;
    public menuIcon = faBars;
    public closeIcon = faXmark;
    public bellIcon = faBell;
    public username = 'User';
    public dateTime = new Date().toLocaleString();
    public logo = 'assets/images/coin.png';

    public isMobileNavMenuOpen = false;
    public isUserMenuOpen = false;
    public isSidebarOpen = false;

    @Output() public toggleOpenSidebar = new EventEmitter<boolean>(false);

    @ViewChild('dropdownUserMenuComponent')
    private dropdownUserMenuComponent?: DropdownMenuComponent;

    public constructor(private readonly userDataService: CurrentUserDataService) {}

    public ngOnInit(): void {
        this.userDataService.userData$.subscribe((user) => {
            this.username = user['username'];
            this.dateTime = new Date(user['date'] ?? 0).toLocaleString();
            //console.log(user['date']);
        });
    }

    public onToggleOpenSidebar(): void {
        this.isSidebarOpen = !this.isSidebarOpen;
        this.toggleOpenSidebar.emit(this.isSidebarOpen);
    }

    public openUserMenuDropdown(): void {
        setTimeout(() => this.dropdownUserMenuComponent?.openDropdown());
    }
}
