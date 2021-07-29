import { Component, Input } from '@angular/core';
import { CategoryDTO } from '@coinage-app/interfaces';

@Component({
    selector: 'coinage-app-category-list-item',
    templateUrl: './category-list-item.component.html',
    styleUrls: ['./category-list-item.component.scss'],
})
export class CategoryListItemComponent {
    @Input()
    category!: CategoryDTO;
}
