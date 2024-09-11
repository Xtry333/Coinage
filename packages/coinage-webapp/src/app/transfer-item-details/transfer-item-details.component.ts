import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as Rx from 'rxjs';

import { ItemDetailsDTO } from '@coinage-app/interfaces';

import { CoinageDataService } from '../services/coinage.data-service';
import { NavigatorService } from '../app-routing/navigator.service';
import { NotificationService } from '../services/notification.service';
import { CoinageRoutes } from '../app-routing/app-routes';

@Component({
    selector: 'app-transfer-item-details',
    templateUrl: './transfer-item-details.component.html',
    styleUrls: ['./transfer-item-details.component.scss'],
})
export class TransferItemDetailsComponent implements OnInit, OnDestroy {
    public showPage = false;

    public item!: ItemDetailsDTO;

    public routeSubscription!: Rx.Subscription;

    public constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly navigator: NavigatorService,
        private readonly coinageData: CoinageDataService,
        private readonly notificationService: NotificationService,
    ) {}

    public ngOnInit(): void {
        this.routeSubscription = this.route.paramMap.subscribe((params) => {
            this.showPage = false;
            const itemId = parseInt(params.get('id') ?? '');
            if (itemId) {
                this.loadItemDetails(itemId);
            } else {
                this.navigator.goToNotFoundPage();
            }
        });
    }

    public ngOnDestroy(): void {
        this.routeSubscription.unsubscribe();
    }

    private loadItemDetails(id: number): void {
        this.coinageData
            .getItemDetails(id)
            .then((item) => {
                this.item = item;
                console.log(this.item);
            })
            .catch(() => {
                this.notificationService.push({
                    title: 'Error',
                    message: 'Item not found',
                });
                this.navigator.goTo(CoinageRoutes.DashboardPage.getUrl({}));
                throw 404;
            })
            .finally(() => {
                this.showPage = true;
            });
    }
}
