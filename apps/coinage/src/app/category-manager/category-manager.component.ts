import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'coinage-app-category-manager',
    templateUrl: './category-manager.component.html',
    styleUrls: ['./category-manager.component.less'],
})
export class CategoryManagerComponent implements OnInit {
    showPage = false;
    constructor() {}

    ngOnInit(): void {
        this.showPage = true;
    }
}
