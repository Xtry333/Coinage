import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { CreateEditTransferComponent } from './create-edit-transfer.component';

describe('CreateEditTransferComponent', () => {
    let component: CreateEditTransferComponent;
    let fixture: ComponentFixture<CreateEditTransferComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule, HttpClientTestingModule],
            declarations: [CreateEditTransferComponent],
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
        fixture = TestBed.createComponent(CreateEditTransferComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
