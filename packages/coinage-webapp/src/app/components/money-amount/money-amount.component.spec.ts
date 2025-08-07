import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoneyAmountComponent, MoneyAmountComponentData } from './money-amount.component';

describe(MoneyAmountComponent.name, () => {
    let component: MoneyAmountComponent;
    let fixture: ComponentFixture<MoneyAmountComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MoneyAmountComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MoneyAmountComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
