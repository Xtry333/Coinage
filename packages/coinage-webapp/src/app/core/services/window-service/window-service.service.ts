import { Injectable } from '@angular/core';

@Injectable()
export class WindowsService {
    public getWindow() {
        return window;
    }
}
