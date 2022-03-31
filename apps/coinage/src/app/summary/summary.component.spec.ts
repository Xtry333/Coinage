import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivatedRoute } from '@angular/router';
import { ApiPathsModule } from '@coinage-app/router';
import { AppRoutingModule } from '../app-routing/app-routing.module';
import { CoinageDataService } from '../services/coinage.data-service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SummaryComponent } from './summary.component';
import { of } from 'rxjs';

describe('Summary Component', () => {
    let component: SummaryComponent;
    let fixture: ComponentFixture<SummaryComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule, HttpClientTestingModule],
            declarations: [SummaryComponent],
            providers: [
                AppRoutingModule,
                ApiPathsModule,
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
                        date: '2021-05-16',
                        otherTransfers: [],
                        description: '',
                        createdDate: new Date('2021-05-16'),
                        editedDate: new Date('2021-05-16'),
                    });
                })
        );
        fixture = TestBed.createComponent(SummaryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create component and show page', () => {
        expect(component).toBeTruthy();
        expect(component.showPage).toBeTruthy();
    });

    it('should show page', () => {});
});
