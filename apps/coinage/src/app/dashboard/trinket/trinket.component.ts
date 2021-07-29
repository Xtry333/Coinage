import { Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'coinage-app-trinket',
    templateUrl: './trinket.component.html',
    styleUrls: ['./trinket.component.scss'],
})
export class TrinketComponent implements OnInit, OnChanges {
    private trinketElement!: HTMLElement;
    private isGrabbed = false;
    private offset: { x: number; y: number } = { x: 0, y: 0 };
    private trinketHolderId = 'trinket-container-' + (Math.random() * 10000).toFixed(0);

    public closeIcon = faTimes;

    @Input() isDisplayed = false;

    @Output() hideModal: EventEmitter<void> = new EventEmitter();
    @Output() moveModal: EventEmitter<boolean> = new EventEmitter<boolean>();

    // constructor() {}

    ngOnInit(): void {
        const el = document.getElementById('fresh-trinket-container');
        if (el) {
            this.trinketElement = el;
            this.trinketElement.style.left = this.getPageWidth() - 400 + 'px';
            this.trinketElement.style.top = '35px';
            this.trinketElement.id = this.trinketHolderId;
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.isDisplayed && changes.isDisplayed.currentValue === false && changes.isDisplayed.previousValue === true) {
            this.trinketElement.style.left = this.getPageWidth() - 400 + 'px';
            this.trinketElement.style.top = '35px';
        }
    }

    @HostListener('mousedown', ['$event'])
    onMouseDown(event: MouseEvent) {
        if (event.target === this.trinketElement) {
            this.isGrabbed = true;
            this.moveModal.emit(true);
            this.offset = {
                x: event.clientX - (this.parsePx(this.trinketElement.style.left) || event.clientX),
                y: event.clientY - (this.parsePx(this.trinketElement.style.top) || event.clientY),
            };
        }
    }

    @HostListener('document:mouseup', ['$event'])
    onMouseUp() {
        this.isGrabbed = false;
        this.moveModal.emit(false);
        this.trinketElement.setAttribute('attr-moving', 'false');
    }

    @HostListener('document:mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
        if (this.isGrabbed) {
            this.trinketElement.style.right = '';
            this.moveModal.emit(true);

            if (event.clientX - this.offset.x > 0 && event.clientX - this.offset.x < this.getPageWidth() - this.trinketElement.clientWidth) {
                this.trinketElement.style.left = event.clientX - this.offset.x + 'px';
            }

            if (event.clientY - this.offset.y > 0 && event.clientY - this.offset.y < this.getPageHeight() - this.trinketElement.clientHeight) {
                this.trinketElement.style.top = event.clientY - this.offset.y + 'px';
            }

            this.trinketElement.setAttribute('attr-moving', 'true');
            window.getSelection()?.removeAllRanges();
        }
    }

    public hideTrinket(): void {
        this.hideModal.emit();
    }

    private getPageWidth(): number {
        const body = document.body;
        const html = document.documentElement;
        return Math.max(body.offsetWidth, html.clientWidth, html.offsetWidth);
    }

    private getPageHeight(): number {
        const body = document.body;
        const html = document.documentElement;
        return Math.min(body.offsetHeight, html.clientHeight, html.offsetHeight);
    }

    private parsePx(px: string): number {
        const data = parseInt(px.replace('px', ''));
        return isNaN(data) ? 0 : data;
    }
}
