import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, NgZone, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';

@Component({
    selector: 'app-big-counter',
    templateUrl: './big-counter.component.html',
    styleUrls: ['./big-counter.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class BigCounterComponent implements OnChanges, OnDestroy {
    @Input() public value = 0;
    @Input() public upperLabel = '';
    @Input() public lowerLabel = '';
    @Input() public animate = true;

    public displayValue = '0.00';

    private animationFrameId: number | null = null;
    private startValue = 0;
    private targetValue = 0;
    private animationStart = 0;

    private static readonly ANIMATION_DURATION_MS = 500;

    constructor(
        private readonly ngZone: NgZone,
        private readonly cdr: ChangeDetectorRef,
    ) {}

    public ngOnChanges(changes: SimpleChanges): void {
        if (!changes['value']) return;

        const newTarget = parseFloat(changes['value'].currentValue);
        if (!this.animate || changes['value'].isFirstChange()) {
            this.targetValue = newTarget;
            this.startValue = newTarget;
            this.displayValue = this.formatValue(newTarget);
            return;
        }

        this.cancelAnimation();
        this.startValue = this.getCurrentAnimatedValue();
        this.targetValue = newTarget;
        this.animationStart = 0;

        this.ngZone.runOutsideAngular(() => {
            this.animationFrameId = requestAnimationFrame((ts) => this.tick(ts));
        });
    }

    public ngOnDestroy(): void {
        this.cancelAnimation();
    }

    private tick(timestamp: number): void {
        if (!this.animationStart) {
            this.animationStart = timestamp;
        }

        const elapsed = timestamp - this.animationStart;
        const progress = Math.min(elapsed / BigCounterComponent.ANIMATION_DURATION_MS, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out

        const current = this.startValue + (this.targetValue - this.startValue) * eased;
        this.displayValue = this.formatValue(current);
        this.cdr.detectChanges();

        if (progress < 1) {
            this.animationFrameId = requestAnimationFrame((ts) => this.tick(ts));
        } else {
            this.animationFrameId = null;
        }
    }

    private getCurrentAnimatedValue(): number {
        if (!this.animationFrameId || !this.animationStart) {
            return this.targetValue;
        }
        const elapsed = performance.now() - this.animationStart;
        const progress = Math.min(elapsed / BigCounterComponent.ANIMATION_DURATION_MS, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        return this.startValue + (this.targetValue - this.startValue) * eased;
    }

    private cancelAnimation(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    private formatValue(val: number): string {
        return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}
