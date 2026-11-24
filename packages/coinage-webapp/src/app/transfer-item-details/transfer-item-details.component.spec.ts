import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { TransferItemDetailsComponent } from './transfer-item-details.component';
import { NavigatorService } from '../app-routing/navigator.service';
import { CoinageDataService } from '../services/coinage.data-service';
import { NotificationService } from '../services/notification.service';

describe('TransferItemDetailsComponent', () => {
    let component: TransferItemDetailsComponent;
    let fixture: ComponentFixture<TransferItemDetailsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule],
            declarations: [TransferItemDetailsComponent],
            providers: [
                { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: '12' })) } },
                {
                    provide: CoinageDataService,
                    useValue: {
                        getItemDetails: jest.fn().mockResolvedValue({
                            id: 12,
                            itemName: 'Milk',
                            isArchived: false,
                            tags: [{ id: 2, name: 'Food', color: null }],
                            itemContainers: [],
                            transfersWithItems: [],
                        }),
                    },
                },
                { provide: NavigatorService, useValue: { goTo: jest.fn(), goToNotFoundPage: jest.fn() } },
                { provide: NotificationService, useValue: { push: jest.fn() } },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(TransferItemDetailsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('links to the dedicated edit page while displaying item tags read-only', () => {
        const editLink: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
        expect(editLink.getAttribute('href')).toBe('/item/edit/12');
        expect(editLink.textContent?.trim()).toBe('Edit');
        expect(fixture.nativeElement.querySelector('app-tag-badges')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('app-tag-selector')).toBeNull();
        expect(fixture.nativeElement.textContent).toContain('Available for new transfers');
    });

    it('identifies archived items as unavailable for new transfers', () => {
        component.item.isArchived = true;
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain('Archived — hidden from new transfers');
    });
});
