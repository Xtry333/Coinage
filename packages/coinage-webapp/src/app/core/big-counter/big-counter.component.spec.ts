import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BigCounterComponent } from './big-counter.component';

function formattedValue(value: number): string {
    return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

describe('BigCounterComponent', () => {
    let component: BigCounterComponent;
    let fixture: ComponentFixture<BigCounterComponent>;
    let originalRAF: typeof window.requestAnimationFrame;
    let originalCAF: typeof window.cancelAnimationFrame;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [BigCounterComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        originalRAF = window.requestAnimationFrame;
        originalCAF = window.cancelAnimationFrame;
        window.requestAnimationFrame = jest.fn().mockReturnValue(1);
        window.cancelAnimationFrame = jest.fn();

        fixture = TestBed.createComponent(BigCounterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        component.ngOnDestroy();
        window.requestAnimationFrame = originalRAF;
        window.cancelAnimationFrame = originalCAF;
        jest.restoreAllMocks();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have default displayValue of 0.00', () => {
        expect(component.displayValue).toBe('0.00');
    });

    it('should start animation on first change with non-zero value', () => {
        const rafSpy = jest.fn().mockReturnValue(1);
        window.requestAnimationFrame = rafSpy;

        component.ngOnChanges({
            value: new SimpleChange(undefined, 1234.56, true),
        });

        expect(rafSpy).toHaveBeenCalled();
    });

    it('should schedule animation on first change with zero value', () => {
        component.ngOnChanges({
            value: new SimpleChange(undefined, 0, true),
        });

        expect(component.displayValue).toBe('0.00');
        expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
    });

    it('should set displayValue immediately when animate is false', () => {
        component.animate = false;

        component.ngOnChanges({
            value: new SimpleChange(0, 999.99, false),
        });

        expect(component.displayValue).toContain('999');
        expect(component.displayValue).toContain('99');
    });

    it('should cancel a running animation when a new value disables animation', () => {
        component.ngOnChanges({
            value: new SimpleChange(0, 1000, true),
        });

        component.animate = false;
        component.ngOnChanges({
            value: new SimpleChange(1000, 250, false),
        });

        expect(window.cancelAnimationFrame).toHaveBeenCalledWith(1);
        expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
        expect(component.displayValue).toBe(formattedValue(250));
    });

    it('should ignore changes that do not include value', () => {
        const initialDisplay = component.displayValue;

        component.ngOnChanges({
            upperLabel: new SimpleChange('', 'PLN', false),
        });

        expect(component.displayValue).toBe(initialDisplay);
    });

    it('should start animation on value changes', () => {
        const rafSpy = jest.fn().mockReturnValue(1);
        window.requestAnimationFrame = rafSpy;

        component.ngOnChanges({
            value: new SimpleChange(100, 200, false),
        });
        expect(rafSpy).toHaveBeenCalled();
    });

    it('should cancel previous animation when value changes mid-animation', () => {
        const cancelSpy = jest.fn();
        window.cancelAnimationFrame = cancelSpy;
        window.requestAnimationFrame = jest.fn().mockReturnValue(42);

        // First change starts animation.
        component.ngOnChanges({
            value: new SimpleChange(undefined, 100, true),
        });

        // Second change replaces the animation.
        component.ngOnChanges({
            value: new SimpleChange(100, 200, false),
        });

        // Third change should cancel the previous animation
        component.ngOnChanges({
            value: new SimpleChange(200, 300, false),
        });

        expect(cancelSpy).toHaveBeenCalledWith(42);
    });

    it('should cancel animation on destroy', () => {
        const cancelSpy = jest.fn();
        window.cancelAnimationFrame = cancelSpy;
        window.requestAnimationFrame = jest.fn().mockReturnValue(99);

        component.ngOnChanges({
            value: new SimpleChange(undefined, 100, true),
        });
        component.ngOnChanges({
            value: new SimpleChange(100, 200, false),
        });

        component.ngOnDestroy();

        expect(cancelSpy).toHaveBeenCalledWith(99);
    });

    it('should not call cancelAnimationFrame on destroy when no animation is running', () => {
        const cancelSpy = jest.fn();
        window.cancelAnimationFrame = cancelSpy;

        component.ngOnDestroy();

        expect(cancelSpy).not.toHaveBeenCalled();
    });

    it('should format negative values correctly', () => {
        component.animate = false;
        component.ngOnChanges({
            value: new SimpleChange(undefined, -500.5, true),
        });

        expect(component.displayValue).toContain('500');
        expect(component.displayValue).toContain('50');
    });

    it('should format zero value with two decimal places', () => {
        component.animate = false;
        component.ngOnChanges({
            value: new SimpleChange(undefined, 0, true),
        });

        expect(component.displayValue).toBe(formattedValue(0));
    });

    describe('tick animation', () => {
        let rafCallback: FrameRequestCallback;
        let rafSpy: jest.Mock;
        let nowSpy: jest.SpyInstance;

        beforeEach(() => {
            rafSpy = jest.fn().mockImplementation((cb: FrameRequestCallback) => {
                rafCallback = cb;
                return 1;
            });
            window.requestAnimationFrame = rafSpy;
            window.cancelAnimationFrame = jest.fn();
            nowSpy = jest.spyOn(performance, 'now').mockReturnValue(1000);

            // Set initial value without animation
            component.animate = false;
            component.ngOnChanges({
                value: new SimpleChange(undefined, 0, true),
            });
            component.animate = true;
        });

        it('should interpolate value during animation', () => {
            component.ngOnChanges({
                value: new SimpleChange(0, 1000, false),
            });

            // Simulate frames: first sets animationStart, second is at midpoint
            const startTime = 1000;
            rafCallback(startTime);
            rafCallback(startTime + 500); // 50% of the 1000ms duration

            // Quartic ease-out: 1 - (1 - 0.5)^4 = 0.9375.
            expect(component.displayValue).toBe(formattedValue(937.5));
        });

        it('should reach exact target value at animation end', () => {
            component.ngOnChanges({
                value: new SimpleChange(0, 1000, false),
            });

            const startTime = 1000;
            rafCallback(startTime);
            rafCallback(startTime + 1000); // 100% progress

            expect(component.displayValue).toBe(formattedValue(1000));
        });

        it('should request next frame when animation is not complete', () => {
            component.ngOnChanges({
                value: new SimpleChange(0, 1000, false),
            });

            const callCountBefore = rafSpy.mock.calls.length;

            const startTime = 1000;
            rafCallback(startTime);
            rafCallback(startTime + 100); // 10% through, not done

            expect(rafSpy.mock.calls.length).toBeGreaterThan(callCountBefore);
        });

        it('should not request next frame when animation is complete', () => {
            component.ngOnChanges({
                value: new SimpleChange(0, 1000, false),
            });

            const startTime = 1000;
            rafCallback(startTime);

            const callCountBefore = rafSpy.mock.calls.length;
            rafCallback(startTime + 1100); // past duration

            expect(rafSpy.mock.calls.length).toBe(callCountBefore);
        });

        it('should animate from current position when interrupted mid-animation', () => {
            component.ngOnChanges({
                value: new SimpleChange(0, 1000, false),
            });

            const startTime = 1000;
            rafCallback(startTime);
            rafCallback(startTime + 500); // partial progress, value 937.5
            nowSpy.mockReturnValue(startTime + 500);
            expect(component.displayValue).toBe(formattedValue(937.5));

            // Change target while animating
            component.ngOnChanges({
                value: new SimpleChange(1000, 0, false),
            });

            const newStart = 2000;
            rafCallback(newStart);
            expect(component.displayValue).toBe(formattedValue(937.5));
            rafCallback(newStart + 500);
            expect(component.displayValue).toBe(formattedValue(58.59375));
            rafCallback(newStart + 1000); // complete new animation

            expect(component.displayValue).toBe(formattedValue(0));
        });
    });

    describe('template rendering', () => {
        it('should render labels and value in the template', () => {
            fixture.componentRef.setInput('upperLabel', 'PLN');
            fixture.componentRef.setInput('lowerLabel', 'Main Account');
            fixture.componentRef.setInput('animate', false);
            fixture.componentRef.setInput('value', 1500.75);
            fixture.detectChanges();

            const el: HTMLElement = fixture.nativeElement;
            expect(el.textContent).toContain('PLN');
            expect(el.textContent).toContain('Main Account');
            expect(el.textContent).toContain(formattedValue(1500.75));
        });
    });
});
