import { Component, ElementRef, HostListener } from '@angular/core';

@Component({
    selector: 'app-dropdown-menu',
    templateUrl: './dropdown-menu.component.html',
    styleUrls: ['./dropdown-menu.component.scss'],
})
export class DropdownMenuComponent {
    public isDropdownOpen = false;

    public constructor(private eRef: ElementRef) {}

    public openDropdown(): void {
        this.isDropdownOpen = true;
    }

    @HostListener('document:click', ['$event'])
    public clickOutside($event: Event): void {
        //if (!this.eRef.nativeElement.contains($event.target)) {
        this.isDropdownOpen = false;
        //}
    }

    @HostListener('document:keydown.escape')
    public onEscapeUserMenu() {
        this.isDropdownOpen = false;
    }
}
