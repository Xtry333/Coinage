import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivatedRoute } from '@angular/router';
import { AppRoutingModule } from '../app-routing/app-routing.module';
import { CoinageDataService } from '../services/coinage.data-service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MonthSummaryComponent } from './month-summary.component';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

describe('Summary Component', () => {
    let component: MonthSummaryComponent;
    let fixture: ComponentFixture<MonthSummaryComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule, HttpClientTestingModule],
            declarations: [MonthSummaryComponent],
            providers: [
                AppRoutingModule,
                {
                    provide: ActivatedRoute,
                    useValue: {
                        paramMap: of({
                            get: () => {
                                return 1;
                            },
                        }),
                    },
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        jest.spyOn(CoinageDataService.prototype, 'getTransferDetails').mockImplementation(
            (id) =>
                new Promise((resolve) => {
                    return resolve({
                        id: id,
                        amount: 123.1,
                        categoryPath: [],
                        contractor: 'Abc',
                        date: new Date(2021-05-16),
                        otherTransfers: [],
                        description: '',
                        createdDate: new Date('2021-05-16'),
                        editedDate: new Date('2021-05-16'),
                    });
                })
        );
        fixture = TestBed.createComponent(MonthSummaryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create component and show page', () => {
        expect(component).toBeTruthy();
        expect(component.showPage).toBeTruthy();
    });

    it('should show page', () => {});
});
