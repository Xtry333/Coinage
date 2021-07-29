import { Component, OnInit } from '@angular/core';
import { CategoryDTO } from '@coinage-app/interfaces';
import { finalize } from 'rxjs/operators';
import { CoinageDataService } from '../services/coinageData.service';

@Component({
    selector: 'coinage-app-category-manager',
    templateUrl: './category-manager.component.html',
    styleUrls: ['./category-manager.component.scss'],
})
export class CategoryManagerComponent implements OnInit {
    showPage = false;
    categories = [];
    parentCategory!: CategoryDTO;

    constructor(private readonly coinageDataService: CoinageDataService) {}

    public ngOnInit(): void {
        this.showPage = false;
        this.coinageDataService
            .getCategoryTree()
            .pipe(
                finalize(() => {
                    this.showPage = true;
                    console.log(this.categories);
                })
            )
            .subscribe((c) => (this.parentCategory = this.createRootCategory(c)));
        //this.parentCategory = this.createRootCategory();
    }

    private createRootCategory(c: CategoryDTO[]): CategoryDTO {
        return {
            id: 0,
            name: 'Root',
            children: c,
        };
    }
}
