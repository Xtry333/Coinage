import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as Rx from 'rxjs';

import { Unit } from '@app/common-units';
import { AdvancedItemContainer, ItemDetailsDTO } from '@app/interfaces';

import { CoinageRoutes } from '../app-routing/app-routes';
import { NavigatorService } from '../app-routing/navigator.service';
import { CoinageDataService } from '../services/coinage.data-service';
import { NotificationService } from '../services/notification.service';

@Component({
    selector: 'app-transfer-item-details',
    templateUrl: './transfer-item-details.component.html',
    styleUrls: ['./transfer-item-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
})
export class TransferItemDetailsComponent implements OnInit, OnDestroy {
    public showPage = false;

    public item!: ItemDetailsDTO;
    public selectedTagIds: number[] = [];
    public savingTags = false;

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

    public perItemWeight(container: AdvancedItemContainer): string | null {
        const weight = container.weight ?? null;
        const weightUnit = (container.weightUnit as Unit) ?? null;
        const itemCount = container.itemCount ?? null;
        if (!weight || !itemCount || itemCount <= 0) return null;
        const perItem = weight / itemCount;
        if (weightUnit === Unit.KG) {
            return perItem >= 1 ? `${perItem.toFixed(3)} kg` : `${(perItem * 1000).toFixed(0)} g`;
        }
        if (weightUnit === Unit.G) {
            return perItem >= 1000 ? `${(perItem / 1000).toFixed(3)} kg` : `${perItem.toFixed(0)} g`;
        }
        return `${perItem.toFixed(3)} ${weightUnit ?? ''}`.trim();
    }

    public async saveTags(): Promise<void> {
        if (this.savingTags) return;
        this.savingTags = true;
        try {
            const response = await this.coinageData.setItemTags(this.item.id, this.selectedTagIds);
            if (response.error) throw new Error(response.error);
            await this.loadItemDetails(this.item.id);
            this.notificationService.push({ title: 'Tags saved', message: 'Transfers now inherit the updated item tags.' });
        } catch {
            this.notificationService.error('Could not save item tags.');
        } finally {
            this.savingTags = false;
        }
    }

    private loadItemDetails(id: number): Promise<void> {
        return this.coinageData
            .getItemDetails(id)
            .then((item) => {
                this.item = item;
                this.selectedTagIds = [...new Set((item.tags ?? []).map((tag) => tag.id))];
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
