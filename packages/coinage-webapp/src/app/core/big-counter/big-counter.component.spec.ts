import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';

import { BigCounterComponent } from './big-counter.component';

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

        fixture = TestBed.createComponent(BigCounterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        component.ngOnDestroy();
        window.requestAnimationFrame = originalRAF;
        window.cancelAnimationFrame = originalCAF;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have default displayValue of 0.00', () => {
        expect(component.displayValue).toBe('0.00');
    });

    it('should set displayValue immediately on first change', () => {
        component.ngOnChanges({
            value: new SimpleChange(undefined, 1234.56, true),
        });

        expect(component.displayValue).toContain('1');
        expect(component.displayValue).toContain('234');
        expect(component.displayValue).toContain('56');
    });

    it('should set displayValue immediately when animate is false', () => {
        component.animate = false;

        component.ngOnChanges({
            value: new SimpleChange(0, 999.99, false),
        });

        expect(component.displayValue).toContain('999');
        expect(component.displayValue).toContain('99');
    });

    it('should ignore changes that do not include value', () => {
        const initialDisplay = component.displayValue;

        component.ngOnChanges({
            upperLabel: new SimpleChange('', 'PLN', false),
        });

        expect(component.displayValue).toBe(initialDisplay);
    });

    it('should start animation on subsequent value changes', () => {
        const rafSpy = jest.fn().mockReturnValue(1);
        window.requestAnimationFrame = rafSpy;

        // First change (no animation)
        component.ngOnChanges({
            value: new SimpleChange(undefined, 100, true),
        });
        expect(rafSpy).not.toHaveBeenCalled();

        // Second change (should animate)
        component.ngOnChanges({
            value: new SimpleChange(100, 200, false),
        });
        expect(rafSpy).toHaveBeenCalled();
    });

    it('should cancel previous animation when value changes mid-animation', () => {
        const cancelSpy = jest.fn();
        window.cancelAnimationFrame = cancelSpy;
        window.requestAnimationFrame = jest.fn().mockReturnValue(42);

        // First change (no animation)
        component.ngOnChanges({
            value: new SimpleChange(undefined, 100, true),
        });

        // Second change starts animation
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
        component.ngOnChanges({
            value: new SimpleChange(undefined, -500.5, true),
        });

        expect(component.displayValue).toContain('500');
        expect(component.displayValue).toContain('50');
    });

    it('should format zero value with two decimal places', () => {
        component.ngOnChanges({
            value: new SimpleChange(undefined, 0, true),
        });

        expect(component.displayValue).toBe('0.00');
    });

    describe('tick animation', () => {
        let rafCallback: FrameRequestCallback;
        let rafSpy: jest.Mock;

        beforeEach(() => {
            rafSpy = jest.fn().mockImplementation((cb: FrameRequestCallback) => {
                rafCallback = cb;
                return 1;
            });
            window.requestAnimationFrame = rafSpy;
            window.cancelAnimationFrame = jest.fn();

            // Set initial value without animation
            component.ngOnChanges({
                value: new SimpleChange(undefined, 0, true),
            });
        });

        it('should interpolate value during animation', () => {
            component.ngOnChanges({
                value: new SimpleChange(0, 1000, false),
            });

            // Simulate frames: first sets animationStart, second is at midpoint
            const startTime = 1000;
            rafCallback(startTime);
            rafCallback(startTime + 250); // 50% progress

            // At 50% progress with cubic ease-out: 1 - (1-0.5)^3 = 0.875
            // Expected value: 0 + 1000 * 0.875 = 875
            expect(component.displayValue).toContain('875');
        });

        it('should reach exact target value at animation end', () => {
            component.ngOnChanges({
                value: new SimpleChange(0, 1000, false),
            });

            const startTime = 1000;
            rafCallback(startTime);
            rafCallback(startTime + 500); // 100% progress

            expect(component.displayValue).toContain('1');
            expect(component.displayValue).toContain('000');
            expect(component.displayValue).toContain('00');
        });

        it('should request next frame when animation is not complete', () => {
            component.ngOnChanges({
                value: new SimpleChange(0, 1000, false),
            });

            const callCountBefore = rafSpy.mock.calls.length;

            const startTime = 1000;
            rafCallback(startTime);
            rafCallback(startTime + 100); // 20% through, not done

            expect(rafSpy.mock.calls.length).toBeGreaterThan(callCountBefore);
        });

        it('should not request next frame when animation is complete', () => {
            component.ngOnChanges({
                value: new SimpleChange(0, 1000, false),
            });

            const startTime = 1000;
            rafCallback(startTime);

            const callCountBefore = rafSpy.mock.calls.length;
            rafCallback(startTime + 600); // past duration

            expect(rafSpy.mock.calls.length).toBe(callCountBefore);
        });

        it('should animate from current position when interrupted mid-animation', () => {
            component.ngOnChanges({
                value: new SimpleChange(0, 1000, false),
            });

            const startTime = 1000;
            rafCallback(startTime);
            rafCallback(startTime + 250); // partial progress, value ~875

            // Change target while animating
            component.ngOnChanges({
                value: new SimpleChange(1000, 0, false),
            });

            const newStart = 2000;
            rafCallback(newStart);
            rafCallback(newStart + 500); // complete new animation

            expect(component.displayValue).toBe('0.00');
        });
    });

    describe('template rendering', () => {
        it('should render labels and value in the template', () => {
            fixture.componentRef.setInput('upperLabel', 'PLN');
            fixture.componentRef.setInput('lowerLabel', 'Main Account');
            fixture.componentRef.setInput('value', 1500.75);
            fixture.detectChanges();

            const el: HTMLElement = fixture.nativeElement;
            expect(el.textContent).toContain('PLN');
            expect(el.textContent).toContain('Main Account');
            expect(el.textContent).toContain('1');
            expect(el.textContent).toContain('500');
            expect(el.textContent).toContain('75');
        });
    });
});
