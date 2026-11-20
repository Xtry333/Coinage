import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EMPTY, Subscription, catchError, forkJoin, from, switchMap } from 'rxjs';

import { CategoryDTO, CreateEditItemDTO } from '@app/interfaces';

import { CoinageRoutes } from '../app-routing/app-routes';
import { NavigatorService } from '../app-routing/navigator.service';
import { CoinageDataService } from '../services/coinage.data-service';
import { NotificationService } from '../services/notification.service';

@Component({
    selector: 'app-edit-item',
    templateUrl: './edit-item.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
})
export class EditItemComponent implements OnInit, OnDestroy {
    public selectedItemInputs?: CreateEditItemDTO;
    public categories: CategoryDTO[] = [];
    public saving = false;

    private routeSubscription?: Subscription;

    public constructor(
        private readonly route: ActivatedRoute,
        private readonly navigator: NavigatorService,
        private readonly coinageData: CoinageDataService,
        private readonly notificationService: NotificationService,
    ) {}

    public ngOnInit(): void {
        this.routeSubscription = this.route.paramMap
            .pipe(
                switchMap((params) => {
                    this.selectedItemInputs = undefined;
                    const id = Number(params.get('id'));
                    if (!Number.isSafeInteger(id) || id <= 0) {
                        this.navigator.goToNotFoundPage();
                        return EMPTY;
                    }
                    return forkJoin({
                        item: from(this.coinageData.getItemDetails(id)),
                        categories: this.coinageData.getCategoryList(),
                    }).pipe(
                        catchError(() => {
                            this.notificationService.error('Could not load item for editing.');
                            this.navigator.goTo(CoinageRoutes.ItemsListPage.getUrl({}));
                            return EMPTY;
                        }),
                    );
                }),
            )
            .subscribe(({ item, categories }) => {
                this.categories = categories;
                this.selectedItemInputs = new CreateEditItemDTO(
                    item.id,
                    item.brand,
                    item.itemName,
                    item.categoryId,
                    item.container?.size ?? null,
                    item.container?.unit ?? null,
                    [...new Set((item.tags ?? []).map((tag) => tag.id))],
                );
            });
    }

    public ngOnDestroy(): void {
        this.routeSubscription?.unsubscribe();
    }

    public get isValid(): boolean {
        const name = this.selectedItemInputs?.name.trim() ?? '';
        const brand = this.selectedItemInputs?.brand?.trim() ?? '';
        return name.length > 0 && name.length <= 50 && brand.length <= 50;
    }

    public async onClickSaveItem(): Promise<void> {
        if (this.saving || !this.isValid || !this.selectedItemInputs) return;
        const inputs = this.selectedItemInputs;
        const request = new CreateEditItemDTO(
            inputs.id,
            inputs.brand?.trim() || null,
            inputs.name.trim(),
            inputs.categoryId ?? null,
            inputs.containerSize,
            inputs.containerSizeUnit,
            [...new Set(inputs.tagIds ?? [])],
        );
        this.saving = true;
        try {
            const response = await this.coinageData.postCreateItem(request);
            if (response.error || !response.insertedId) throw new Error('Item not saved');
            const linkTo = CoinageRoutes.TransferItemDetailsPage.getUrl({ id: response.insertedId });
            this.notificationService.push({ title: 'Item Saved', message: request.name, linkTo });
            this.navigator.goTo(linkTo);
        } catch {
            this.notificationService.error('Could not save item. Please try again.');
        } finally {
            this.saving = false;
        }
    }

    public onClickCancelEdit(): void {
        if (!this.saving && this.selectedItemInputs?.id) {
            this.navigator.goTo(CoinageRoutes.TransferItemDetailsPage.getUrl({ id: this.selectedItemInputs.id }));
        }
    }
}
