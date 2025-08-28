import { Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-modal',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.scss'],
    standalone: false,
})
export class ModalComponent implements OnInit, OnChanges {
    private modalElement!: HTMLElement;
    private isGrabbed = false;
    private offset: { x: number; y: number } = { x: 0, y: 0 };
    private modalHolderId = 'modal-container-' + (Math.random() * 10000).toFixed(0);

    public closeIcon = faTimes;

    @Input() public closeable = true;
    @Input() public isDisplayed = false;
    @Input() public centered = false;
    @Input() public moveable = true;

    @Output() public hideModalEvent: EventEmitter<void> = new EventEmitter();
    @Output() public moveModalEvent: EventEmitter<boolean> = new EventEmitter<boolean>();

    public ngOnInit(): void {
        const el = document.getElementById('fresh-modal-container');
        if (el) {
            this.modalElement = el;
            if (!this.centered) {
                this.modalElement.style.left = this.getPageWidth() - 400 + 'px';
                this.modalElement.style.top = '35px';
            }
            this.modalElement.id = this.modalHolderId;
        }
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes['isDisplayed'] && changes['isDisplayed'].currentValue === false && changes['isDisplayed'].previousValue === true) {
            if (!this.centered) {
                this.modalElement.style.left = this.getPageWidth() - 400 + 'px';
                this.modalElement.style.top = '35px';
            } else {
                // Reset centered modal positioning
                this.modalElement.style.left = '';
                this.modalElement.style.top = '';
                this.modalElement.style.transform = '';
            }
        }
    }

    @HostListener('mousedown', ['$event'])
    public onMouseDown(event: MouseEvent) {
        if (event.target === this.modalElement && this.moveable) {
            this.isGrabbed = true;
            this.moveModalEvent.emit(true);

            // Get the actual position of the modal on screen
            const rect = this.modalElement.getBoundingClientRect();

            this.offset = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
            };
        }
    }

    @HostListener('document:mouseup', ['$event'])
    public onMouseUp() {
        if (this.moveable) {
            this.isGrabbed = false;
            this.moveModalEvent.emit(false);
            this.modalElement.setAttribute('attr-moving', 'false');
        }
    }

    @HostListener('document:mousemove', ['$event'])
    public onMouseMove(event: MouseEvent) {
        if (this.isGrabbed && this.moveable) {
            this.modalElement.style.right = '';
            this.moveModalEvent.emit(true);

            // Remove centering when dragging starts
            if (this.centered) {
                this.modalElement.style.transform = '';
                this.modalElement.classList.remove('centered');
            }

            if (event.clientX - this.offset.x > 0 && event.clientX - this.offset.x < this.getPageWidth() - this.modalElement.clientWidth) {
                this.modalElement.style.left = event.clientX - this.offset.x + 'px';
            }

            if (event.clientY - this.offset.y > 0 && event.clientY - this.offset.y < this.getPageHeight() - this.modalElement.clientHeight) {
                this.modalElement.style.top = event.clientY - this.offset.y + 'px';
            }

            this.modalElement.setAttribute('attr-moving', 'true');
            window.getSelection()?.removeAllRanges();
        }
    }

    public hideModal(): void {
        this.hideModalEvent.emit();
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
