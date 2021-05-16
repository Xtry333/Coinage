import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { AppRoutingModule } from '../app-routing/app-routing.module';

import { TransferDetailsComponent } from './transfer-details.component';
import { CoinageDataService } from '../coinageData.service';

import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiPathsModule } from '@coinage-app/router';
import { of } from 'rxjs';

describe('TransferDetailsComponent', () => {
    let component: TransferDetailsComponent;
    let fixture: ComponentFixture<TransferDetailsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule, HttpClientTestingModule],
            declarations: [TransferDetailsComponent],
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
        jest.spyOn(
            CoinageDataService.prototype,
            'getTransferDetails'
        ).mockImplementation(
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
        fixture = TestBed.createComponent(TransferDetailsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create component and show page', () => {
        expect(component).toBeTruthy();
        expect(component.showPage).toBeTruthy();
    });

    it('should show page', () => {});
});
