import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCoffee } from '@fortawesome/free-solid-svg-icons';

import { ButtonIconComponent } from './button-icon.component';

describe('ButtonIconComponent', () => {
    let component: ButtonIconComponent;
    let fixture: ComponentFixture<ButtonIconComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ButtonIconComponent],
            imports: [FontAwesomeModule],
        });
        fixture = TestBed.createComponent(ButtonIconComponent);
        component = fixture.componentInstance;
        component.icon = faCoffee; // Set required icon for testing
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit clicked event when not disabled', () => {
        spyOn(component.clicked, 'emit');
        component.onClick();
        expect(component.clicked.emit).toHaveBeenCalled();
    });

    it('should not emit clicked event when disabled', () => {
        component.disabled = true;
        spyOn(component.clicked, 'emit');
        component.onClick();
        expect(component.clicked.emit).not.toHaveBeenCalled();
    });

    it('should apply correct size classes', () => {
        component.size = 'lg';
        expect(component.buttonClasses).toContain('h-10 w-10');
        expect(component.iconSize).toContain('h-5 w-5');
    });
});
