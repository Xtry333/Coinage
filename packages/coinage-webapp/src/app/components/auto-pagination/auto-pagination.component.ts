import { Component, EventEmitter, HostListener, Output } from '@angular/core';

@Component({
    selector: 'app-auto-pagination',
    templateUrl: './auto-pagination.component.html',
    styleUrls: ['./auto-pagination.component.scss'],
    standalone: false,
})
export class AutoPaginationComponent {
    @Output() public endOfPage = new EventEmitter<void>();

    @HostListener('window:scroll', ['$event'])
    public isScrolledIntoView() {
        const scrollPosition = document.documentElement.scrollTop || document.body.scrollTop;
        const max = document.documentElement.scrollHeight - window.innerHeight;

        if (scrollPosition == max) {
            this.endOfPage.emit();
        }
    }
}
