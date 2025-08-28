import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconDefinition, SizeProp } from '@fortawesome/fontawesome-svg-core';

export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
    selector: 'app-button-icon',
    templateUrl: './button-icon.component.html',
    styleUrls: ['./button-icon.component.scss'],
    standalone: false,
})
export class ButtonIconComponent {
    @Input() icon!: IconDefinition;
    @Input() size: ButtonSize = 'md';
    @Input() disabled = false;
    @Input() ariaLabel?: string;
    @Input() type: 'button' | 'submit' | 'reset' = 'button';
    @Input() variant: 'default' | 'ghost' = 'default';

    @Output() clicked = new EventEmitter<void>();

    private static readonly BASE_CLASSES =
        'flex items-center justify-center rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200';

    private static readonly SIZE_CLASSES: Record<ButtonSize, string> = {
        sm: 'h-6 w-6 text-xs',
        md: 'h-8 w-8 text-sm',
        lg: 'h-10 w-10 text-base',
    };

    private static readonly VARIANT_CLASSES: Record<'default' | 'ghost', string> = {
        default: 'border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed',
        ghost: 'p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed',
    };

    get buttonClasses(): string {
        return `${ButtonIconComponent.BASE_CLASSES} ${ButtonIconComponent.SIZE_CLASSES[this.size]} ${ButtonIconComponent.VARIANT_CLASSES[this.variant]}`;
    }

    get iconSize(): SizeProp {
        return this.size === 'lg' ? 'lg' : 'sm';
    }

    onClick(): void {
        if (!this.disabled) {
            this.clicked.emit();
        }
    }
}
