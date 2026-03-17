import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { NewTransferDetailsComponent } from './new-transfer-details.component';

describe('NewTransferDetailsComponent', () => {
    let component: NewTransferDetailsComponent;
    let fixture: ComponentFixture<NewTransferDetailsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule, HttpClientTestingModule],
            declarations: [NewTransferDetailsComponent],
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
        fixture = TestBed.createComponent(NewTransferDetailsComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
