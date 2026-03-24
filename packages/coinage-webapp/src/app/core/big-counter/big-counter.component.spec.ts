import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef, SimpleChange } from '@angular/core';

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
        const rafSpy = jasmine.createSpy('requestAnimationFrame').and.returnValue(1);
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
        const cancelSpy = jasmine.createSpy('cancelAnimationFrame');
        window.cancelAnimationFrame = cancelSpy;
        window.requestAnimationFrame = jasmine.createSpy('requestAnimationFrame').and.returnValue(42);

        // First change
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
        const cancelSpy = jasmine.createSpy('cancelAnimationFrame');
        window.cancelAnimationFrame = cancelSpy;
        window.requestAnimationFrame = jasmine.createSpy('requestAnimationFrame').and.returnValue(99);

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
        const cancelSpy = jasmine.createSpy('cancelAnimationFrame');
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
        let rafSpy: jasmine.Spy;

        beforeEach(() => {
            rafSpy = jasmine.createSpy('requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => {
                rafCallback = cb;
                return 1;
            });
            window.requestAnimationFrame = rafSpy;
            window.cancelAnimationFrame = jasmine.createSpy('cancelAnimationFrame');

            // Set initial value
            component.ngOnChanges({
                value: new SimpleChange(undefined, 0, true),
            });
        });

        it('should interpolate value during animation', () => {
            component.ngOnChanges({
                value: new SimpleChange(0, 1000, false),
            });

            // Simulate a frame at the midpoint (250ms into 500ms animation)
            const startTime = 1000;
            rafCallback(startTime); // first frame sets animationStart
            rafCallback(startTime + 250); // midpoint frame

            // At 50% progress with cubic ease-out: 1 - (1-0.5)^3 = 0.875
            // Expected value: 0 + 1000 * 0.875 = 875
            expect(component.displayValue).toContain('875');
        });

        it('should reach exact target value at animation end', () => {
            component.ngOnChanges({
                value: new SimpleChange(0, 1000, false),
            });

            const startTime = 1000;
            rafCallback(startTime); // sets animationStart
            rafCallback(startTime + 500); // exactly at duration end

            expect(component.displayValue).toContain('1');
            expect(component.displayValue).toContain('000');
            expect(component.displayValue).toContain('00');
        });

        it('should request next frame when animation is not complete', () => {
            component.ngOnChanges({
                value: new SimpleChange(0, 1000, false),
            });

            const callCountBefore = rafSpy.calls.count();

            const startTime = 1000;
            rafCallback(startTime);

            // Midway frame should request another frame
            rafCallback(startTime + 100);

            expect(rafSpy.calls.count()).toBeGreaterThan(callCountBefore);
        });

        it('should not request next frame when animation is complete', () => {
            component.ngOnChanges({
                value: new SimpleChange(0, 1000, false),
            });

            const startTime = 1000;
            rafCallback(startTime);

            const callCountBefore = rafSpy.calls.count();

            // Final frame at or past duration
            rafCallback(startTime + 600);

            // No new rAF should be scheduled after completion
            expect(rafSpy.calls.count()).toBe(callCountBefore);
        });

        it('should animate from current position when interrupted', () => {
            component.ngOnChanges({
                value: new SimpleChange(0, 1000, false),
            });

            // Simulate partial animation
            const startTime = 1000;
            rafCallback(startTime);
            rafCallback(startTime + 250); // midpoint, value ~875

            // Now change target while animating
            component.ngOnChanges({
                value: new SimpleChange(1000, 0, false),
            });

            // First frame of new animation
            const newStart = 2000;
            rafCallback(newStart);
            rafCallback(newStart + 500); // complete new animation

            // Should end at the new target (0)
            expect(component.displayValue).toBe('0.00');
        });
    });

    describe('template rendering', () => {
        it('should render labels and value in the template', () => {
            component.upperLabel = 'PLN';
            component.lowerLabel = 'Main Account';
            component.ngOnChanges({
                value: new SimpleChange(undefined, 1500.75, true),
            });
            fixture.changeDetectorRef.markForCheck();
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
