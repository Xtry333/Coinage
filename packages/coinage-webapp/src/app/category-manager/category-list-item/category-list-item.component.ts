import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CategoryDTO } from '@coinage-app/interfaces';
import { faEdit } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-category-list-item',
    templateUrl: './category-list-item.component.html',
    styleUrls: ['./category-list-item.component.scss'],
})
export class CategoryListItemComponent {
    public editIcon = faEdit;

    @Input() public category!: CategoryDTO;

    @Output() public editCategory = new EventEmitter<CategoryDTO>();

    public onSelectCategoryForEdit(category: CategoryDTO): void {
        this.editCategory.emit(category);
    }
}
