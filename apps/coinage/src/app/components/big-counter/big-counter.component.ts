import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';

@Component({
    selector: 'coinage-app-big-counter',
    templateUrl: './big-counter.component.html',
    styleUrls: ['./big-counter.component.scss'],
})
export class BigCounterComponent implements OnChanges, OnDestroy {
    @Input() value = 0;
    @Input() topHeader = '';
    @Input() botHeader = '';
    @Input() animate = true;

    internalValue = 0;

    animateInterval?: ReturnType<typeof setInterval>;

    ngOnChanges(changes: SimpleChanges): void {
        const targetValue = parseFloat(changes.value.currentValue);
        if (!this.animate) {
            this.internalValue = targetValue;
        } else {
            this.tryClearAnimateInterval();

            this.animateInterval = setInterval(() => {
                this.animateCounterValue(targetValue);
            }, 10);
        }
    }

    ngOnDestroy(): void {
        this.tryClearAnimateInterval();
    }

    animateCounterValue(targetValue: number) {
        const delta = Math.abs(targetValue - this.internalValue) / 25;
        if (this.internalValue + delta < targetValue && this.internalValue <= targetValue && delta > 0.0001) {
            this.internalValue += delta;
        } else if (this.internalValue + delta > targetValue && this.internalValue >= targetValue && delta > 0.0001) {
            this.internalValue -= delta;
        } else {
            this.internalValue = targetValue;
            this.tryClearAnimateInterval();
        }
    }

    tryClearAnimateInterval() {
        if (this.animateInterval) {
            clearInterval(this.animateInterval);
            this.animateInterval = undefined;
        }
    }

    get displayValue() {
        return this.internalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}
