import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CoinageDataService } from '../services/coinageData.service';

import { DashboardComponent } from './dashboard.component';

import { MockBuilder, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { SSL_OP_NO_TLSv1_1 } from 'node:constants';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiPathsModule } from '@coinage-app/router';
import { PlnCurrencyPipe } from '../pipes/pln-currency.pipe';
import { AppRoutingModule } from '../app-routing/app-routing.module';
import { RouterModule } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

describe('DashboardComponent', () => {
    let component: DashboardComponent;
    let fixture: ComponentFixture<DashboardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule, HttpClientTestingModule],
            declarations: [DashboardComponent, PlnCurrencyPipe],
            providers: [ApiPathsModule],
        }).compileComponents();
    });

    beforeEach(() => {
        jest.spyOn(CoinageDataService.prototype, 'getTransactionsObserver').mockImplementation(() =>
            of([
                {
                    id: 1,
                    description: 'Test',
                    amount: 213.59,
                    date: '2021-05-16',
                    category: 'TestCat',
                    categoryId: 1,
                },
                {
                    id: 2,
                    description: 'Test 2',
                    amount: 99.99,
                    date: '2021-05-15',
                    category: 'TestCat',
                    categoryId: 1,
                },
            ])
        );
        fixture = TestBed.createComponent(DashboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
