import { Component, Input, OnChanges, OnInit, SimpleChange } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

// interface PageNumber {
//     value: number;
//     isSpacer: boolean;
// }

interface PaginationQueryParams {
    page: number;
    rowsPerPage: number;
}

type PageNumber =
    | {
          value: number;
          isSpacer?: false;
          isActive: boolean;
      }
    | {
          value: undefined;
          isSpacer: true;
          isActive?: false;
      };

@Component({
    selector: 'app-pagination',
    templateUrl: './pagination.component.html',
    styleUrls: ['./pagination.component.scss'],
})
export class PaginationComponent implements OnInit, OnChanges {
    @Input() public firstPage = 1;
    @Input() public currentPage = 1;
    @Input() public lastPage = 1;

    public pageNumbers: PageNumber[] = [{ value: this.firstPage, isActive: false }];

    public constructor(private readonly router: Router, private readonly route: ActivatedRoute) {}

    public ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
            const { page } = params as PaginationQueryParams;
            const currentPageNumber = Number(page);
            if (currentPageNumber > 0 && currentPageNumber <= this.lastPage) {
                this.currentPage = currentPageNumber;
            } else {
                this.currentPage = 1;
                this.goToPage(this.currentPage);
            }
            this.calculatePageNumbers();
        });
    }

    public ngOnChanges(changes: { lastPage: SimpleChange }): void {
        if (changes.lastPage.currentValue !== changes.lastPage.previousValue) {
            this.calculatePageNumbers();
        }
    }

    private calculatePageNumbers(showAll: boolean = false) {
        const pageNumbers = new Set<number>([this.firstPage]);
        for (let i = 0; i < (showAll ? this.lastPage : 3); i++) {
            pageNumbers.add(this.firstPage + i);
            pageNumbers.add(this.currentPage + i);
            pageNumbers.add(this.currentPage - i);
            pageNumbers.add(this.lastPage - i);
        }

        const numbers = Array.from(pageNumbers)
            .filter((n) => n >= this.firstPage && n <= this.lastPage)
            .sort((a, b) => a - b);

        for (let i = 0; i < numbers.length - 1; i++) {
            const differenceWithNextNumber = numbers[i + 1] - (numbers[i] + 1);
            if (differenceWithNextNumber === 1) {
                numbers.splice(i + 1, 0, numbers[i] + 1);
                i += 1;
            } else if (differenceWithNextNumber > 1) {
                numbers.splice(i + 1, 0, 0);
                i += 1;
            }
        }

        this.pageNumbers = numbers.map((n) => (n ? { value: n, isActive: n === this.currentPage } : { value: undefined, isSpacer: true }));
    }

    public onClickChangePage(event: MouseEvent, pageNumber: PageNumber) {
        if (!pageNumber.isSpacer) {
            this.currentPage = pageNumber.value;
            this.goToPage(pageNumber.value);
            this.calculatePageNumbers();
        } else {
            this.calculatePageNumbers(true);
        }
    }

    private goToPage(pageNumber: number) {
        this.router.navigate([], {
            queryParams: {
                page: pageNumber,
            },
        });
    }
}
