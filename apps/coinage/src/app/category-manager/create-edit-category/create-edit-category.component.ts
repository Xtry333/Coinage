import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CategoryDTO, CreateEditCategoryDTO } from '@coinage-app/interfaces';

import { CoinageDataService } from '../../services/coinageData.service';

@Component({
    selector: 'coinage-app-create-edit-category',
    templateUrl: './create-edit-category.component.html',
    styleUrls: ['./create-edit-category.component.scss'],
})
export class CreateEditCategoryComponent implements OnChanges {
    @Input() selectedCategory?: CategoryDTO;

    @Output() categorySaved = new EventEmitter<CategoryDTO>();

    public editedCategory: CreateEditCategoryDTO = { name: '', description: '' };

    constructor(private readonly coinageDataService: CoinageDataService) {}

    public ngOnChanges(): void {
        this.editedCategory.name = this.selectedCategory?.name ?? '';
        this.editedCategory.description = this.selectedCategory?.description ?? '';
    }

    public onSaveCategory(): void {
        console.log('hi');
        if (this.editedCategory?.name && this.selectedCategory) {
            this.coinageDataService
                .postCreateCategory({
                    id: this.selectedCategory?.id,
                    name: this.editedCategory.name,
                    description: (this.editedCategory.description?.length ?? 0) > 0 ? this.editedCategory.description : null,
                })
                .subscribe((r) => {
                    this.categorySaved.emit({
                        ...this.selectedCategory,
                        id: r.insertedId ?? 0,
                        name: this.editedCategory.name,
                        description: this.editedCategory.description,
                    });
                });
            console.log('Category saved');
        } else {
            console.log('No category name');
        }
    }
}
