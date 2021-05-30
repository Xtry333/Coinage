import { Component, Input, OnInit } from '@angular/core';
import { CategoryDTO } from '@coinage-app/interfaces';

@Component({
    selector: 'coinage-app-category-list-item',
    templateUrl: './category-list-item.component.html',
    styleUrls: ['./category-list-item.component.less'],
    inputs: ['category'],
})
export class CategoryListItemComponent implements OnInit {
    constructor() {}

    @Input()
    category: CategoryDTO;

    ngOnInit(): void {}
}
