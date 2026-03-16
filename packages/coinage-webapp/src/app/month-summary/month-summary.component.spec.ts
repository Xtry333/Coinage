import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { CoinageDataService } from '../services/coinage.data-service';
import { MonthSummaryComponent } from './month-summary.component';

describe('Summary Component', () => {
    let component: MonthSummaryComponent;
    let fixture: ComponentFixture<MonthSummaryComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule, HttpClientTestingModule],
            declarations: [MonthSummaryComponent],
            providers: [
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
        jest.spyOn(CoinageDataService.prototype, 'getTransferDetails').mockImplementation((id: number) =>
            Promise.resolve({
                id,
                amount: 123.1,
                type: 0,
                date: new Date('2021-05-16'),
                accountingDate: new Date('2021-05-16'),
                categoryPath: [],
                contractor: 'Abc',
                otherTransfers: [],
                description: '',
                categoryId: 1,
                contractorId: 1,
                account: {} as any,
                targetAccount: {} as any,
                createdDate: new Date('2021-05-16'),
                editedDate: new Date('2021-05-16'),
                items: [],
                receipt: null,
                isPlanned: false,
                isRefundable: false,
                parentId: null,
            } as any),
        );
        fixture = TestBed.createComponent(MonthSummaryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create component and show page', () => {
        expect(component).toBeTruthy();
    });

    it('should show page', () => {});
});
