import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { faUser } from '@fortawesome/free-solid-svg-icons';

import { CoinageRoutes } from '../../app-routing/app-routes';
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
    standalone: false,
})
export class SidebarNavComponent implements OnInit {
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
            url: CoinageRoutes.DashboardPage.getUrl({}),
        },
        {
            text: 'Transfers',
            icon: 'bi-card-list',
            url: CoinageRoutes.TransfersListPage.getUrl({}),
        },
        {
            text: 'Items',
            icon: 'bi-box',
            url: CoinageRoutes.ItemsListPage.getUrl({}),
        },
        {
            text: 'Categories',
            icon: 'bi-tag',
            url: CoinageRoutes.CategoryManagerPage.getUrl({}),
        },
        {
            text: 'Account 1',
            icon: 'bi-wallet',
            url: CoinageRoutes.AccountDetailsPage.getUrl({ id: 1 }),
        },
        {
            text: 'Add Transfer',
            icon: 'bi-plus',
            url: CoinageRoutes.CreateTransferPage.getUrl({}),
        },
        {
            text: 'Add Receipt',
            icon: 'bi-plus',
            url: CoinageRoutes.CreateMultipleTransfersPage.getUrl({}),
        },
        {
            text: 'Account Settings',
            icon: 'bi-person',
            url: CoinageRoutes.ManageAccountsPage.getUrl({}),
        },
    ];

    @ViewChild('dropdownUserMenuComponent')
    private dropdownUserMenuComponent?: DropdownMenuComponent;

    public constructor(
        private eRef: ElementRef,
        private readonly userDataService: CurrentUserDataService,
    ) {}

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
