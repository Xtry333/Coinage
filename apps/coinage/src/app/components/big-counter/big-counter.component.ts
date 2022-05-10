import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';

@Component({
    selector: 'coinage-app-big-counter',
    templateUrl: './big-counter.component.html',
    styleUrls: ['./big-counter.component.scss'],
})
export class BigCounterComponent implements OnChanges, OnDestroy {
    @Input() public value = 0;
    @Input() public topHeader = '';
    @Input() public botHeader = '';
    @Input() public animate = true;

    public internalValue = 0;

    public animateInterval?: ReturnType<typeof setInterval>;

    public ngOnChanges(changes: SimpleChanges): void {
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

    public ngOnDestroy(): void {
        this.tryClearAnimateInterval();
    }

    public animateCounterValue(targetValue: number) {
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

    public tryClearAnimateInterval() {
        if (this.animateInterval) {
            clearInterval(this.animateInterval);
            this.animateInterval = undefined;
        }
    }

    public get displayValue() {
        return this.internalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}
