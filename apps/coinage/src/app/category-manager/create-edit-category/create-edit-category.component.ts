import { CategoryDTO, CreateEditCategoryDTO } from '@coinage-app/interfaces';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';

import { CoinageDataService } from '../../services/coinage.data-service';

@Component({
    selector: 'coinage-app-create-edit-category',
    templateUrl: './create-edit-category.component.html',
    styleUrls: ['./create-edit-category.component.scss'],
})
export class CreateEditCategoryComponent implements OnInit, OnChanges {
    public categories: CategoryDTO[] = [];

    @Input() selectedCategory?: CategoryDTO;

    @Output() categorySaved = new EventEmitter<CategoryDTO>();

    public editedCategory: CreateEditCategoryDTO = { name: '', description: '' };

    constructor(private readonly coinageDataService: CoinageDataService) {}

    public ngOnInit(): void {
        this.coinageDataService.getCategoryList().subscribe((categories) => {
            this.categories = categories;
        });
    }

    public ngOnChanges(): void {
        this.editedCategory.name = this.selectedCategory?.name ?? '';
        this.editedCategory.description = this.selectedCategory?.description ?? '';
        this.editedCategory.parentId = this.selectedCategory?.parentId ?? null;
    }

    public onSaveCategory(): void {
        if (this.editedCategory?.name && this.selectedCategory) {
            this.coinageDataService
                .postCreateCategory({
                    id: this.selectedCategory?.id,
                    name: this.editedCategory.name,
                    description: (this.editedCategory.description?.length ?? 0) > 0 ? this.editedCategory.description : null,
                    parentId: this.editedCategory.parentId,
                })
                .subscribe((r) => {
                    this.categorySaved.emit({
                        ...this.selectedCategory,
                        id: r.insertedId ?? 0,
                        name: this.editedCategory.name,
                        parentId: this.editedCategory.parentId,
                        description: this.editedCategory.description,
                    });
                });
            console.log('Category saved');
        } else {
            console.log('No category name');
        }
    }
}
