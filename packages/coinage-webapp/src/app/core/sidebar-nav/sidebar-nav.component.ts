import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { faUser } from '@fortawesome/free-solid-svg-icons';

import { NavigatorPages } from '../../services/navigator.service';
import { CurrentUserDataService } from '../../services/current-user.service';
import { DropdownMenuComponent } from '../dropdown-menu/dropdown-menu.component';

interface UiNavLink {
    text: string;
    icon: string;
    url: string;
}

@Component({
    selector: 'app-sidebar-nav',
    templateUrl: './sidebar-nav.component.html',
    styleUrls: ['./sidebar-nav.component.scss'],
})
export class SidebarNavComponent implements OnInit {
    public NavigatorPages = NavigatorPages;

    public title = 'Coinage';

    public userIcon = faUser;
    public username = 'User';
    public dateTime = new Date().toLocaleString();
    public logo = 'assets/images/coin.png';

    private avatarHash = '8ca90535394f0044abe3fdc86e950431';

    public isSidebarOpen = true;
    public isUserMenuOpen = false;

    public links: UiNavLink[] = [
        {
            text: 'Dashboard',
            icon: 'bi-house-door',
            url: NavigatorPages.Dashboard(),
        },
        {
            text: 'Transfers',
            icon: 'bi-card-list',
            url: NavigatorPages.TransfersList(),
        },
        {
            text: 'Categories',
            icon: 'bi-tag',
            url: '/manage/categories',
        },
        {
            text: 'Add Transfer',
            icon: 'bi-plus',
            url: '/transfer/add',
        },
        {
            text: 'Add Receipt',
            icon: 'bi-plus',
            url: '/transfer/create',
        },
        {
            text: 'Account Settings',
            icon: 'bi-person',
            url: '/manage/accounts',
        },
    ];

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

    public openUserMenuDropdown(): void {
        setTimeout(() => this.dropdownUserMenuComponent?.openDropdown());
    }

    public get avatarLink(): string {
        return `https://www.gravatar.com/avatar/${this.avatarHash}`;
    }
}
