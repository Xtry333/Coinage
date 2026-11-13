import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
    selector: 'app-section',
    templateUrl: './section.component.html',
    styleUrls: ['./section.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
})
export class SectionComponent {
    @Input() public class?: string;
    @Input() public header?: string;
}
