import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountDetailsPage } from './account-details-page.component';

describe(AccountDetailsPage.name, () => {
    let component: AccountDetailsPage;
    let fixture: ComponentFixture<AccountDetailsPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AccountDetailsPage],
        }).compileComponents();

        fixture = TestBed.createComponent(AccountDetailsPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
