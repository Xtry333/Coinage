import { Component, EventEmitter, HostListener, Output } from '@angular/core';

@Component({
    selector: 'coinage-app-auto-pagination',
    templateUrl: './auto-pagination.component.html',
    styleUrls: ['./auto-pagination.component.scss'],
})
export class AutoPaginationComponent {
    @Output() endOfPage = new EventEmitter<void>();

    @HostListener('window:scroll', ['$event'])
    isScrolledIntoView() {
        const scrollPosition = document.documentElement.scrollTop || document.body.scrollTop;
        const max = document.documentElement.scrollHeight - window.innerHeight;

        if (scrollPosition == max) {
            this.endOfPage.emit();
        }
    }
}
