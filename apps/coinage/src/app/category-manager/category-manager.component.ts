import { Component, OnInit } from '@angular/core';

import { CategoryDTO } from '@coinage-app/interfaces';
import { CoinageDataService } from '../services/coinage.data-service';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'coinage-app-category-manager',
    templateUrl: './category-manager.component.html',
    styleUrls: ['./category-manager.component.scss'],
})
export class CategoryManagerComponent implements OnInit {
    public showPage = false;
    public categories = [];
    public parentCategory!: CategoryDTO;

    public selectedCategoryForEdit?: CategoryDTO;

    public constructor(private readonly coinageDataService: CoinageDataService) {}

    public ngOnInit(): void {
        this.showPage = false;
        this.loadData();
        //this.parentCategory = this.createRootCategory();
    }

    private loadData(): void {
        this.coinageDataService
            .getCategoryTree()
            .pipe(
                finalize(() => {
                    this.showPage = true;
                    console.log(this.categories);
                })
            )
            .subscribe((c) => (this.parentCategory = this.createRootCategory(c)));
    }

    private createRootCategory(c: CategoryDTO[]): CategoryDTO {
        return {
            id: 0,
            name: 'Root',
            children: c,
        };
    }

    public onSelectCategoryForEdit(category: CategoryDTO): void {
        console.log(category);
        this.selectedCategoryForEdit = category;
    }

    public onCategorySaved(category: CategoryDTO): void {
        console.log(category);
        this.loadData();
    }
}
