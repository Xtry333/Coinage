import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ReceiptDetailsDTO, ReceiptProcessingStatus } from '@app/interfaces';
import { of } from 'rxjs';
import { CoinageDataService } from '../services/coinage.data-service';
import { SocketService } from '../services/socket.service';
import { ReceiptDetailsComponent } from './receipt-details.component';

const MOCK_RECEIPT: ReceiptDetailsDTO = {
    id: 1,
    description: 'Test receipt',
    date: new Date('2024-01-15'),
    nextTransferDate: undefined,
    amount: 99.5,
    totalAmount: 99.5,
    totalTransferred: 50.0,
    contractorId: 1,
    contractorName: 'Biedronka',
    allTransfers: [],
};

describe('ReceiptDetailsComponent', () => {
    let component: ReceiptDetailsComponent;
    let fixture: ComponentFixture<ReceiptDetailsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule, HttpClientTestingModule],
            declarations: [ReceiptDetailsComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        paramMap: of({ get: () => '1' }),
                    },
                },
                {
                    provide: SocketService,
                    useValue: {
                        fromEvent: () => of(),
                    },
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        jest.spyOn(CoinageDataService.prototype, 'getReceiptDetails').mockResolvedValue(MOCK_RECEIPT);
        jest.spyOn(CoinageDataService.prototype, 'getReceiptStatus').mockResolvedValue({
            status: ReceiptProcessingStatus.PROCESSED,
            aiData: { items: [] },
        });

        fixture = TestBed.createComponent(ReceiptDetailsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('sets uploadStatus to "processed" when receipt status is PROCESSED', async () => {
        await fixture.whenStable();
        expect(component.uploadStatus).toBe('processed');
    });

    it('sets uploadStatus to "queued" when receipt status is PENDING', async () => {
        jest.spyOn(CoinageDataService.prototype, 'getReceiptStatus').mockResolvedValue({
            status: ReceiptProcessingStatus.PENDING,
        });
        fixture = TestBed.createComponent(ReceiptDetailsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
        expect(component.uploadStatus).toBe('queued');
    });

    it('remainingAmount returns difference between transferred and total', async () => {
        await fixture.whenStable();
        // MOCK_RECEIPT: totalTransferred=50, amount=99.5 → remaining=49.5
        expect(component.remainingAmount).toBeCloseTo(49.5);
    });
});
